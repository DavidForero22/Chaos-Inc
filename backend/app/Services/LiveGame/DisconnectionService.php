<?php
// app/Services/DisconnectionService.php

namespace App\Services\LiveGame;

use App\Events\RoomStateUpdated;
use App\Jobs\InheritBossRoleJob;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;

class DisconnectionService
{
    public function __construct(
        protected GameFinalizationService $finalizationService,
    ) {}

    /**
     * El jefe real se desconecta — abre ventana de gracia de 10s.
     */
    public function handleBossDisconnection(string $roomId, string $bossName): void
    {
        Redis::set("room:{$roomId}:boss_grace_period", $bossName);
        InheritBossRoleJob::dispatch($roomId)->delay(now()->addSeconds(10));
    }

    /**
     * Comprueba si la gracia del jefe ha expirado y actúa.
     * Se llama en cada /sync y en cada acción de juego.
     */
    public function checkBossGracePeriod(string $roomId): void
    {
        // Si la partida ya está terminada o cancelada, no intentar heredar nada más
        if (Redis::hget("room:{$roomId}", 'game_over') == 1) {
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
            $pData = Redis::hgetall("room:{$roomId}:player:{$name}");
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

        // NUEVO: Llevamos la cuenta de cuántos quedan vivos
        $onlineCount = 0;

        foreach ($players as $name) {
            $pData    = Redis::hgetall("room:{$roomId}:player:{$name}");
            $role     = $pData['role'] ?? '';
            $isOnline = ($pData['is_online'] ?? '1') !== '0';
            $isDead   = filter_var($pData['is_dead'] ?? false, FILTER_VALIDATE_BOOLEAN);

            if ($isOnline && !$isDead) {
                $onlineCount++; // Sumamos un superviviente

                if ($role === 'secretary' && $secretary === null) $secretary = $name;
                if ($role === 'intern'    && $intern    === null) $intern    = $name;
            }
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
            Redis::hset("room:{$roomId}:player:{$newActingBoss}", 'acting_boss', 1);
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
        Redis::hset("room:{$roomId}:player:{$actingBossName}", 'acting_boss', 0);
        Redis::set("room:{$roomId}:acting_boss_grace_period", $actingBossName);
        InheritBossRoleJob::dispatch($roomId)->delay(now()->addSeconds(10));

        event(new RoomStateUpdated($roomId));
    }

    /**
     * No hay nadie que pueda heredar el cargo de jefe.
     * Si han pasado 2+ rondas, victoria union. Si no, partida cancelada.
     */
    public function resolveNoInheritance(string $roomId): void
    {
        $roundNumber = (int) Redis::hget("room:{$roomId}", 'round_number');

        if ($roundNumber >= 2) {
            // Partida válida — victoria para el sindicato
            Redis::hset("room:{$roomId}", 'game_over', 1);
            Redis::hset("room:{$roomId}", 'winner_role', 'union');
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
        // Si la partida ya terminó o la sala está siendo finalizada, ignorar
        if (
            Redis::hget("room:{$roomId}", 'game_over') === '1' ||
            !Redis::exists("room:{$roomId}")
        ) {
            return;
        }

        Redis::hset("room:{$roomId}:player:{$playerName}", 'is_online', 0);
        Redis::hset("room:{$roomId}:player:{$playerName}", 'disconnected_at', time());
        $playerData = Redis::hgetall("room:{$roomId}:player:{$playerName}");
        Log::info("DisconnectionService.php::processInGameDisconnection - role={$playerData['role']} acting_boss={$playerData['acting_boss']}");

        $onlineCount = 0;
        foreach (Redis::smembers("{$roomKey}:players") as $pName) {
            if (Redis::hget("{$roomKey}:player:{$pName}", 'is_online') === '1') {
                $onlineCount++;
            }
        }

        if ($onlineCount === 0) {
            $this->finalizationService->destroyRoom($roomId);
            return;
        }

        $isRealBoss   = ($playerData['role'] ?? '') === 'boss';
        $isActingBoss = ($playerData['acting_boss'] ?? '0') === '1';

        // 1. Damos prioridad a manejar la herencia del cargo ANTES de la victoria
        if ($isRealBoss) {
            $this->handleBossDisconnection($roomId, $playerName);
        } elseif ($isActingBoss) {
            $this->handleActingBossDisconnection($roomId, $playerName);
        }

        // 2. Comprobamos victoria (incluso si se fue un jugador normal, 
        // o si se fue el jefe y queremos que arranque el contador de fin de partida)
        // Eliminamos el 'return' para que el turno avance de todos modos.
        $this->finalizationService->checkDisconnectionVictory($roomId);

        // 3. Avanzar el turno
        app(LiveGameService::class)->checkAndAdvanceTurnOnDisconnect($roomId, $playerName);
        event(new RoomStateUpdated($roomId));
    }
}
