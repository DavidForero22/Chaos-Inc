<?php
// app/Services/Game/Status/DisconnectionService.php

namespace App\Services\Game\Status;

use App\Events\RoomStateUpdated;
use App\Jobs\InheritBossRoleJob;
use App\Services\Game\Engine\TurnService;
use App\Support\CastHelper;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;

class DisconnectionService
{
    public function __construct(
        protected GameFinalizationService $finalizationService,
        protected TurnService $turnService,
    ) {}

    /**
     * El jefe real se desconecta — abre ventana de gracia de 10s.
     */
    public function handleBossDisconnection(string $roomId, string $bossName): void
    {
        Redis::set("room:{$roomId}:boss_grace_period", $bossName);
        Redis::hset("room:{$roomId}:state", 'turn_expires_at', 0);

        InheritBossRoleJob::dispatch($roomId)->delay(now()->addSeconds(10));
    }

    /**
     * Comprueba si la gracia del jefe ha expirado y actúa.
     * Se llama en cada /sync y en cada acción de juego.
     */
    public function checkBossGracePeriod(string $roomId): void
    {
        $roomStateKey = "room:{$roomId}:state";

        // Si la partida ya está terminada o cancelada, no intentar heredar nada más
        if (Redis::hget($roomStateKey, 'game_over') == 1) {
            return;
        }

        // Si la key sigue viva, el jefe aún tiene tiempo
        if (Redis::exists("room:{$roomId}:boss_grace_period")) {
            return;
        }

        // Si hay una grace period del acting boss activa, tampoco actuar
        if (Redis::exists("room:{$roomId}:acting_boss_grace_period")) {
            return;
        }

        $players          = Redis::smembers("room:{$roomId}:players");
        $bossIsOffline    = false;
        $actingBossExists = false;

        foreach ($players as $name) {
            $pInfoKey = "room:{$roomId}:player:{$name}:info";
            $pData = Redis::hgetall($pInfoKey);
            $isDead = filter_var($pData['is_dead'] ?? false, FILTER_VALIDATE_BOOLEAN);

            // Si el jefe o jefe en funciones está muerto, no tenerlo en cuenta para herencias
            if ($isDead) continue;

            if (($pData['role'] ?? '') === 'boss' && ($pData['is_online'] ?? '1') === '0') {
                $bossIsOffline = true;
            }
            if (($pData['acting_boss'] ?? '0') === '1') {
                $actingBossExists = true;
            }
        }

        // Solo actuar si el jefe sigue offline y nadie ha heredado aún
        if (!$bossIsOffline || $actingBossExists) {
            return;
        }

        $this->inheritBossRole($roomId);
    }

    /**
     * Asigna acting_boss al mejor candidato disponible.
     * Prioridad: secretario → becario → victoria union.
     */
    public function inheritBossRole(string $roomId): void
    {
        $players   = Redis::smembers("room:{$roomId}:players");
        $secretary = null;
        $intern    = null;
        $onlineCount = 0;

        foreach ($players as $name) {
            $pInfoKey = "room:{$roomId}:player:{$name}:info";
            $pData    = Redis::hgetall($pInfoKey);

            $role     = $pData['role'] ?? '';
            $isOnline = ($pData['is_online'] ?? '1') !== '0';
            $isDead   = filter_var($pData['is_dead'] ?? false, FILTER_VALIDATE_BOOLEAN);

            if ($isOnline && !$isDead) {
                $onlineCount++; // Sumamos un superviviente

                if ($role === 'secretary' && $secretary === null) $secretary = $name;
                if ($role === 'intern'    && $intern    === null) $intern    = $name;
            }

            Log::info("DEBUG: Jugador {$name} tiene status de online = [{$isOnline}]");
        }

        // --- LA BARRERA ANTI-MODALS ---
        // Si solo queda 1 persona (o ninguna), la empresa quiebra.
        // NO ascendemos a nadie, simplemente disparamos el final del juego.
        if ($onlineCount <= 1) {
            Log::info("DisconnectionService.php - Solo queda 1 jugador. Ignorando herencia y forzando fin de partida.");
            $this->finalizationService->checkDisconnectionVictory($roomId);
            return;
        }

        $newActingBoss = $secretary ?? $intern ?? null;

        if ($newActingBoss !== null) {
            Redis::hset("room:{$roomId}:player:{$newActingBoss}:info", 'acting_boss', 1);
            event(new RoomStateUpdated($roomId));
        } else {
            $this->resolveNoInheritance($roomId);
        }
    }

    /**
     * El jefe heredado se desconecta.
     * Si era secretario, intenta ceder al becario. Si era becario, no hay más candidatos.
     */
    public function handleActingBossDisconnection(string $roomId, string $actingBossName): void
    {
        Redis::hset("room:{$roomId}:player:{$actingBossName}:info", 'acting_boss', 0);
        Redis::set("room:{$roomId}:acting_boss_grace_period", $actingBossName);
        Redis::hset("room:{$roomId}:state", 'turn_expires_at', 0);

        InheritBossRoleJob::dispatch($roomId)->delay(now()->addSeconds(10));
    }

    /**
     * No hay nadie que pueda heredar el cargo de jefe.
     * Si han pasado 2+ rondas, victoria union. Si no, partida cancelada.
     */
    public function resolveNoInheritance(string $roomId): void
    {
        $roomStateKey = "room:{$roomId}:state";
        $roundNumber = (int) Redis::hget($roomStateKey, 'round_number');

        if ($roundNumber >= 2) {
            // Partida válida — victoria para el sindicato
            Redis::hset($roomStateKey, 'game_over', 1);
            Redis::hset($roomStateKey, 'winner_role', 'union');
            event(new RoomStateUpdated($roomId));
            $this->finalizationService->finalize($roomId);
        } else {
            // Partida cancelada — limpiar sin registrar resultado
            event(new RoomStateUpdated($roomId));
            $this->finalizationService->cancelAndCleanup($roomId);
        }
    }

    public function processInGameDisconnection(string $roomId, string $playerName, string $roomKey): void
    {
        $roomStateKey = "room:{$roomId}:state";

        // Si el state de la sala no existe en Redis, no hacer nada
        if (!Redis::exists($roomStateKey)) {
            return;
        }

        $playerInfoKey = "room:{$roomId}:player:{$playerName}:info";

        Redis::hset($playerInfoKey, 'is_online', 0);
        Redis::hset($playerInfoKey, 'disconnected_at', time());

        $playerData = Redis::hgetall($playerInfoKey);
        $isDead = CastHelper::toBool($playerData['is_dead'] ?? 0);

        Log::info("DisconnectionService.php::processInGameDisconnection - $playerName abandonó la partida. role={$playerData['role']} acting_boss?={$playerData['acting_boss']} is_dead?={$isDead}");

        // Contar cuántos quedan vivos y online
        $onlineAndAliveCount = 0;
        foreach (Redis::smembers("room:{$roomId}:players") as $pName) {
            $pInfoKey = "room:{$roomId}:player:{$pName}:info";
            $pData = Redis::hgetall($pInfoKey);

            $pIsOnline = ($pData['is_online'] ?? '0') === '1';
            $pIsDead = CastHelper::toBool($pData['is_dead'] ?? 0);

            if ($pIsOnline && !$pIsDead) {
                $onlineAndAliveCount++;
            }

            Log::info("DEBUG: Jugador {$pName} tiene status de online = [{$pIsOnline}]");
        }

        // Si no queda nadie vivo y conectado, destruir la sala al instante
        if ($onlineAndAliveCount === 0) {
            Log::info("DisconnectionService.php - No quedan jugadores vivos/online en la sala {$roomId}. Destrucción instantánea.");
            $this->finalizationService->destroyRoom($roomId);
            return;
        }

        // Si la partida ya terminó y aún queda alguien viendo la pantalla final, no procesar turnos ni herencias.
        if (Redis::hget($roomStateKey, 'game_over') === '1') {
            return;
        }

        // --- EXCEPCIÓN DE MUERTOS ---
        // Si el jugador ya estaba muerto, simplemente avisar al frontend de que se ha ido 
        // y parar la ejecución. No comprobar herencias, ni turnos, ni victorias.
        if ($isDead) {
            event(new RoomStateUpdated($roomId, __('game.disconnected', ['player' => $playerName])));
            return;
        }

        $isRealBoss   = ($playerData['role'] ?? '') === 'boss';
        $isActingBoss = ($playerData['acting_boss'] ?? '0') === '1';

        // Dar prioridad a manejar la herencia del cargo antes de la victoria
        if ($isRealBoss) {
            $this->handleBossDisconnection($roomId, $playerName);
        } elseif ($isActingBoss) {
            $this->handleActingBossDisconnection($roomId, $playerName);
        }

        $this->finalizationService->checkDisconnectionVictory($roomId);

        $this->turnService->checkAndAdvanceTurnOnDisconnect($roomId, $playerName);
        event(new RoomStateUpdated($roomId, __('game.disconnected', ['player' => $playerName])));
    }
}
