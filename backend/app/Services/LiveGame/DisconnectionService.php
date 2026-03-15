<?php
// app/Services/DisconnectionService.php

namespace App\Services\LiveGame;

use App\Events\RoomStateUpdated;
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
        Redis::setex("room:{$roomId}:boss_grace_period", 10, $bossName);
    }

    /**
     * El jefe real vuelve antes de que expire la gracia.
     * Cancela el timer y quita acting_boss a quien lo tuviera.
     */
    public function handleBossReconnection(string $roomId): void
    {
        Redis::del("room:{$roomId}:boss_grace_period");

        $players = Redis::smembers("room:{$roomId}:players");
        foreach ($players as $name) {
            if (Redis::hget("room:{$roomId}:player:{$name}", 'acting_boss') === '1') {
                Redis::hset("room:{$roomId}:player:{$name}", 'acting_boss', 0);
            }
        }
    }

    /**
     * Comprueba si la gracia del jefe ha expirado y actúa.
     * Se llama en cada /sync y en cada acción de juego.
     */
    public function checkBossGracePeriod(string $roomId): void
    {
        // Si la key sigue viva, el jefe aún tiene tiempo
        if (Redis::exists("room:{$roomId}:boss_grace_period")) {
            return;
        }

        $players = Redis::smembers("room:{$roomId}:players");
        $bossIsOffline   = false;
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
        $players    = Redis::smembers("room:{$roomId}:players");
        $secretary  = null;
        $intern     = null;

        foreach ($players as $name) {
            $pData    = Redis::hgetall("room:{$roomId}:player:{$name}");
            $role     = $pData['role'] ?? '';
            $isOnline = ($pData['is_online'] ?? '1') !== '0';
            $isDead   = filter_var($pData['is_dead'] ?? false, FILTER_VALIDATE_BOOLEAN);

            if ($isOnline && !$isDead) {
                if ($role === 'secretary' && $secretary === null) $secretary = $name;
                if ($role === 'intern'    && $intern    === null) $intern    = $name;
            }
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

        $actingBossRole = Redis::hget("room:{$roomId}:player:{$actingBossName}", 'role');
        $players        = Redis::smembers("room:{$roomId}:players");
        $nextCandidate  = null;

        // Solo el secretario puede ceder al becario
        if ($actingBossRole === 'secretary') {
            foreach ($players as $name) {
                $pData    = Redis::hgetall("room:{$roomId}:player:{$name}");
                $isOnline = ($pData['is_online'] ?? '1') !== '0';
                $isDead   = filter_var($pData['is_dead'] ?? false, FILTER_VALIDATE_BOOLEAN);
                if (($pData['role'] ?? '') === 'intern' && $isOnline && !$isDead) {
                    $nextCandidate = $name;
                    break;
                }
            }
        }

        if ($nextCandidate !== null) {
            Redis::hset("room:{$roomId}:player:{$nextCandidate}", 'acting_boss', 1);
            event(new RoomStateUpdated($roomId));
        } else {
            $this->resolveNoInheritance($roomId);
        }
    }

    /**
     * No hay nadie que pueda heredar el cargo de jefe.
     * Si han pasado 2+ rondas, victoria union registrada. Si no, partida cancelada.
     */
    private function resolveNoInheritance(string $roomId): void
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
}
