<?php
// app/Services/Game/Status/DisconnectionService.php

namespace App\Services\Game\Status;

use App\Events\RoomStateUpdated;
use App\Jobs\InheritBossRoleJob;
use App\Services\Game\Engine\PlayerHandService;
use App\Services\Game\Engine\TurnService;
use App\Support\CastHelper;
use App\Support\RoomLogger;
use Illuminate\Support\Facades\Redis;

class DisconnectionService
{
    public function __construct(
        protected GameFinalizationService $finalizationService,
        protected TurnService $turnService,
        protected PlayerHandService $handService,
    ) {}

    /**
     * El jefe real se desconecta — abre ventana de gracia de 10s.
     */
    public function handleBossDisconnection(string $roomId): void
    {
        $graceToken = uniqid('grace_boss_', true);

        Redis::set("room:{$roomId}:boss_grace_period", $graceToken);
        Redis::hset("room:{$roomId}:state", 'turn_expires_at', 0);

        InheritBossRoleJob::dispatch($roomId, $graceToken)->delay(now('UTC')->addSeconds(10));
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

        foreach ($players as $playerId) {
            $pInfoKey = "room:{$roomId}:player:{$playerId}:info";
            $pData    = Redis::hgetall($pInfoKey);

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
     * Prioridad: secretario → becaria → victoria union.
     */
    public function inheritBossRole(string $roomId): void
    {
        $players      = Redis::smembers("room:{$roomId}:players");
        $secretaryId  = null;
        $internId     = null;
        $onlineCount  = 0;

        foreach ($players as $playerId) {
            $pInfoKey = "room:{$roomId}:player:{$playerId}:info";
            $pData    = Redis::hgetall($pInfoKey);

            $role      = $pData['role'] ?? '';
            $isOnline  = ($pData['is_online'] ?? '1') !== '0';
            $isDead    = filter_var($pData['is_dead'] ?? false, FILTER_VALIDATE_BOOLEAN);
            $username  = $pData['username'] ?? "Player {$playerId}";

            if ($isOnline && !$isDead) {
                $onlineCount++;

                if ($role === 'secretary' && $secretaryId === null) {
                    $secretaryId = $playerId;
                }

                if ($role === 'intern' && $internId === null) {
                    $internId = $playerId;
                }
            }

            RoomLogger::info($roomId, "DisconnectionService.php::inheritBossRole: Jugador {$username} ({$playerId}) tiene status de online = [{$isOnline}].");
        }

        // --- LA BARRERA ANTI-MODALS ---
        // Si solo queda 1 persona (o ninguna), la empresa quiebra.
        // NO ascendemos a nadie, simplemente disparamos el final del juego.
        if ($onlineCount <= 1) {
            RoomLogger::info($roomId, "DisconnectionService.php: Solo queda 1 jugador. Ignorando herencia y forzando fin de partida.");
            $this->finalizationService->checkDisconnectionVictory($roomId);

            return;
        }

        $newActingBossId = $secretaryId ?? $internId ?? null;

        if ($newActingBossId !== null) {
            Redis::hset(
                "room:{$roomId}:player:{$newActingBossId}:info",
                'acting_boss',
                1
            );

            event(new RoomStateUpdated($roomId));
        } else {
            $this->resolveNoInheritance($roomId);
        }
    }

    /**
     * El jefe heredado se desconecta.
     * Si era secretario, intenta ceder al becaria. Si era becaria, no hay más candidatos.
     */
    public function handleActingBossDisconnection(string $roomId, int $actingBossId): void
    {
        Redis::hset(
            "room:{$roomId}:player:{$actingBossId}:info",
            'acting_boss',
            0
        );

        $graceToken = uniqid('grace_acting_', true);

        Redis::set("room:{$roomId}:acting_boss_grace_period", $graceToken);
        Redis::hset("room:{$roomId}:state", 'turn_expires_at', 0);

        InheritBossRoleJob::dispatch($roomId, $graceToken)->delay(now('UTC')->addSeconds(10));
    }

    /**
     * No hay nadie que pueda heredar el cargo de jefe.
     * Si han pasado 2+ rondas, victoria union. Si no, partida cancelada.
     */
    public function resolveNoInheritance(string $roomId): void
    {
        $roomStateKey = "room:{$roomId}:state";
        $roundNumber  = (int) Redis::hget($roomStateKey, 'round_number');

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

    public function processInGameDisconnection(string $roomId, int $playerId): void
    {
        $roomStateKey = "room:{$roomId}:state";

        // Si el state de la sala no existe en Redis, no hacer nada
        if (!Redis::exists($roomStateKey)) {
            return;
        }

        $playerInfoKey = "room:{$roomId}:player:{$playerId}:info";

        Redis::hset($playerInfoKey, 'is_online', 0);
        Redis::hset($playerInfoKey, 'disconnected_at', time());

        $playerData = Redis::hgetall($playerInfoKey);

        $isDead    = CastHelper::toBool($playerData['is_dead'] ?? 0);
        $username  = $playerData['username'] ?? "Player {$playerId}";

        RoomLogger::info($roomId, "DisconnectionService.php::processInGameDisconnection: {$username} ({$playerId}) abandonó la partida. role={$playerData['role']} acting_boss?={$playerData['acting_boss']} is_dead?={$isDead}.");

        // Contar cuántos quedan vivos y online
        $onlineAndAliveCount = 0;

        foreach (Redis::smembers("room:{$roomId}:players") as $pId) {
            $pInfoKey = "room:{$roomId}:player:{$pId}:info";
            $pData    = Redis::hgetall($pInfoKey);

            $pIsOnline = ($pData['is_online'] ?? '0') === '1';
            $pIsDead   = CastHelper::toBool($pData['is_dead'] ?? 0);
            $pUsername = $pData['username'] ?? "Player {$pId}";

            if ($pIsOnline && !$pIsDead) {
                $onlineAndAliveCount++;
            }

            RoomLogger::info($roomId, "DisconnectionService.php::processInGameDisconnection: Jugador {$pUsername} ({$pId}) tiene status de online = [{$pIsOnline}].");
        }

        // Si no queda nadie vivo y conectado, destruir la sala al instante
        if ($onlineAndAliveCount === 0) {
            RoomLogger::info($roomId, "DisconnectionService.php::processInGameDisconnection: No quedan jugadores vivos/online. Destrucción instantánea.");
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
            event(new RoomStateUpdated(
                $roomId,
                __('game.disconnected', ['player' => $username])
            ));

            return;
        }

        $isRealBoss   = ($playerData['role'] ?? '') === 'boss';
        $isActingBoss = ($playerData['acting_boss'] ?? '0') === '1';

        // Dar prioridad a manejar la herencia del cargo antes de la victoria
        if ($isRealBoss) {
            $this->handleBossDisconnection($roomId);
        } elseif ($isActingBoss) {
            $this->handleActingBossDisconnection($roomId, $playerId);
        }

        $this->finalizationService->checkDisconnectionVictory($roomId);

        // Quitar cartas si se pasa del limite
        $currentTurnPlayerId = Redis::hget($roomStateKey, 'current_turn_player_id');

        if ((string) $currentTurnPlayerId === (string) $playerId) {
            $this->handService->enforceHandLimit($roomId, $playerId);
        }

        $this->turnService->checkAndAdvanceTurnOnDisconnect($roomId, $playerId);

        event(new RoomStateUpdated(
            $roomId,
            __('game.disconnected', ['player' => $username])
        ));
    }
}
