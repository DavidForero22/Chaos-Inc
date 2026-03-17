<?php
// app/Services/LiveGame/ReconnectionService.php

namespace App\Services\LiveGame;

use App\Events\ActingBossAssigned;
use App\Events\RoomStateUpdated;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;

class ReconnectionService
{
    public function __construct(
        protected DisconnectionService $disconnectionService,
    ) {}

    public function handleReconnection(string $roomId, string $playerName, array $playerData): void
    {
        $playerKey = "room:{$roomId}:player:{$playerName}";
        $wasOffline = ($playerData['is_online'] ?? '1') === '0';

        // Volver a ponerlo online
        Redis::hset($playerKey, 'is_online', 1);

        if (!$wasOffline) {
            return; // Si ya estaba online (ej: refrescó la página sin llegar a caerse por timeout) no aplicamos penalizaciones.
        }

        // Penalización por haber caído
        Redis::hset($playerKey, 'skip_next_turn', 1);

        $role = $playerData['role'] ?? '';

        // 1. Si el Jefe Original vuelve
        if ($role === 'boss') {
            Log::info("ReconnectionService.php::handleReconnection: El jefe {$playerName} se reconectó, ejecutando DisconnectionService::handleBossReconnection");
            $this->handleBossReconnection($roomId);
        }

        // 2. Si el Becario (Jefe Heredado) vuelve antes de que expire su gracia
        $actingGraceValue = Redis::get("room:{$roomId}:acting_boss_grace_period");
        if ($actingGraceValue === $playerName) {
            Log::info("ReconnectionService.php::handleReconnection: El becario {$playerName} se reconectó, ejecutando restoreInternGrace");
            $this->restoreInternGrace($roomId, $playerName, $playerKey);
        }

        // 3. Si el Secretario vuelve, prioriza sobre el Becario
        if ($role === 'secretary') {
            Log::info("ReconnectionService.php::handleReconnection: El secretario {$playerName} se reconectó, ejecutando evaluateSecretaryReturn");
            $this->evaluateSecretaryReturn($roomId, $playerName, $playerKey);
        }

        // 4. Si alguien vuelve durante la ending grace period, cancelarla
        if (Redis::exists("room:{$roomId}:ending_grace_period")) {
            Redis::del("room:{$roomId}:ending_grace_period");
            Log::info("ReconnectionService.php::handleReconnection: ending grace period cancelada por reconexión de {$playerName}");
        }
    }

    private function restoreInternGrace(string $roomId, string $playerName, string $playerKey): void
    {
        Redis::del("room:{$roomId}:acting_boss_grace_period");
        Redis::hset($playerKey, 'acting_boss', 1);

        $players = Redis::smembers("room:{$roomId}:players");
        foreach ($players as $pName) {
            if ($pName === $playerName) continue;

            $pData = Redis::hgetall("room:{$roomId}:player:{$pName}");
            if (($pData['role'] ?? '') === 'intern' && ($pData['acting_boss'] ?? '0') === '1') {
                Redis::hset("room:{$roomId}:player:{$pName}", 'acting_boss', 0);
            }
        }

        $this->disconnectionService->notifyInternGraceCancelled($roomId);
    }

    private function evaluateSecretaryReturn(string $roomId, string $playerName, string $playerKey): void
    {
        $bossStillOffline = false;
        $players = Redis::smembers("room:{$roomId}:players");

        foreach ($players as $pName) {
            $pData = Redis::hgetall("room:{$roomId}:player:{$pName}");
            if (($pData['role'] ?? '') === 'boss' && ($pData['is_online'] ?? '1') === '0') {
                $bossStillOffline = true;
                break;
            }
        }

        if ($bossStillOffline) {
            foreach ($players as $pName) {
                $pData = Redis::hgetall("room:{$roomId}:player:{$pName}");
                if (($pData['role'] ?? '') === 'intern' && ($pData['acting_boss'] ?? '0') === '1') {
                    Redis::hset("room:{$roomId}:player:{$pName}", 'acting_boss', 0);
                }
            }

            Redis::hset($playerKey, 'acting_boss', 1);
            event(new ActingBossAssigned($playerName));
        }
    }

    /**
     * El jefe real vuelve a la partida.
     * Cancela el timer y quita acting_boss a quien lo tuviera (si habia alguien).
     */
    private function handleBossReconnection(string $roomId): void
    {
        Redis::del("room:{$roomId}:boss_grace_period");
        Redis::del("room:{$roomId}:acting_boss_grace_period");

        $players = Redis::smembers("room:{$roomId}:players");
        foreach ($players as $name) {
            if (Redis::hget("room:{$roomId}:player:{$name}", 'acting_boss') === '1') {
                Redis::hset("room:{$roomId}:player:{$name}", 'acting_boss', 0);
            }
        }

        $this->disconnectionService->notifyInternGraceCancelled($roomId);
        event(new RoomStateUpdated($roomId));
    }
}
