<?php
// app/Services/DisconnectionService.php

namespace App\Services\LiveGame;

use App\Events\ActingBossAssigned;
use App\Events\ActingBossGracePeriodCancelled;
use App\Events\ActingBossGracePeriodStarted;
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
        Redis::setex("room:{$roomId}:boss_grace_period", 10, $bossName);
        InheritBossRoleJob::dispatch($roomId)->delay(10);
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
            event(new ActingBossAssigned($newActingBoss));
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
        Redis::setex("room:{$roomId}:acting_boss_grace_period", 10, $actingBossName);
        InheritBossRoleJob::dispatch($roomId)->delay(10);

        $players = Redis::smembers("room:{$roomId}:players");
        foreach ($players as $name) {
            $pData    = Redis::hgetall("room:{$roomId}:player:{$name}");
            $isOnline = ($pData['is_online'] ?? '1') !== '0';
            $isDead   = filter_var($pData['is_dead'] ?? false, FILTER_VALIDATE_BOOLEAN);
            if (($pData['role'] ?? '') === 'intern' && $isOnline && !$isDead) {
                event(new ActingBossGracePeriodStarted($name));
                break;
            }
        }
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

    public function notifyInternGraceCancelled(string $roomId): void
    {
        $players = Redis::smembers("room:{$roomId}:players");
        foreach ($players as $name) {
            $pData    = Redis::hgetall("room:{$roomId}:player:{$name}");
            $isOnline = ($pData['is_online'] ?? '1') !== '0';
            $isDead   = filter_var($pData['is_dead'] ?? false, FILTER_VALIDATE_BOOLEAN);
            if (($pData['role'] ?? '') === 'intern' && $isOnline && !$isDead) {
                event(new ActingBossGracePeriodCancelled($name));
                break;
            }
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
        $playerData = Redis::hgetall("room:{$roomId}:player:{$playerName}");
        Log::info("processInGameDisconnection: role={$playerData['role']} acting_boss={$playerData['acting_boss']}");

        $isAnyoneOnline = false;
        foreach (Redis::smembers("{$roomKey}:players") as $pName) {
            if (Redis::hget("{$roomKey}:player:{$pName}", 'is_online') === '1') {
                $isAnyoneOnline = true;
                break;
            }
        }

        if (!$isAnyoneOnline) {
            $this->finalizationService->destroyRoom($roomId);
            return;
        }

        $isRealBoss   = ($playerData['role'] ?? '') === 'boss';
        $isActingBoss = ($playerData['acting_boss'] ?? '0') === '1';

        if ($isRealBoss) {
            $this->handleBossDisconnection($roomId, $playerName);
        } elseif ($isActingBoss) {
            $this->handleActingBossDisconnection($roomId, $playerName);
        } else {
            if (
                !Redis::exists("room:{$roomId}:boss_grace_period") &&
                !Redis::exists("room:{$roomId}:acting_boss_grace_period")
            ) {
                if ($this->finalizationService->checkDisconnectionVictory($roomId)) {
                    return;
                }
            }
        }

        app(LiveGameService::class)->checkAndAdvanceTurnOnDisconnect($roomId, $playerName);
        event(new RoomStateUpdated($roomId));
    }
}
