<?php
// app/Services/LiveGame/ReconnectionService.php

namespace App\Services\LiveGame;

use App\Events\ActingBossAssigned;
use Illuminate\Support\Facades\Redis;

class ReconnectionService
{
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
            app(DisconnectionService::class)->handleBossReconnection($roomId);
        }

        // 2. Si el Becario (Jefe Heredado) vuelve antes de que expire su gracia
        $actingGraceValue = Redis::get("room:{$roomId}:acting_boss_grace_period");
        if ($actingGraceValue === $playerName) {
            $this->restoreInternGrace($roomId, $playerName, $playerKey);
        }

        // 3. Si el Secretario vuelve, prioriza sobre el Becario
        if ($role === 'secretary') {
            $this->evaluateSecretaryReturn($roomId, $playerName, $playerKey);
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

        app(DisconnectionService::class)->notifyInternGraceCancelled($roomId);
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
}
