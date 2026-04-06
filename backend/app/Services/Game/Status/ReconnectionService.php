<?php
// app/Services/Game/Status/ReconnectionService.php

namespace App\Services\Game\Status;

use App\Events\RoomStateUpdated;
use App\Services\Game\Engine\TurnService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;

class ReconnectionService
{
    public function __construct(
        protected DisconnectionService $disconnectionService,
        protected TurnService $turnService,
    ) {}

    public function handleReconnection(string $roomId, string $playerName, array $playerData): void
    {
        $playerInfoKey      = "room:{$roomId}:player:{$playerName}:info";
        $playerTurnStateKey = "room:{$roomId}:player:{$playerName}:turn_state";

        $wasOffline = ($playerData['is_online'] ?? '1') === '0';

        Redis::hset($playerInfoKey, 'is_online', 1);

        if (!$wasOffline) {
            return; // Si ya estaba online
        }

        $disconnectedAt = (int) ($playerData['disconnected_at'] ?? 0);

        // Si ha vuelto en menos de 3 segundos, lo perdonamos (fue un F5 o navegación)
        if (time() - $disconnectedAt <= 3) {
            Log::info("ReconnectionService.php::handleReconnection - Reconexión rápida de {$playerName} (F5). Sin penalización.\n");

            // Si era el jefe, cancelamos el timer de herencia que acababa de empezar
            if (($playerData['role'] ?? '') === 'boss') {
                $this->handleBossReconnection($roomId);
            }
            return;
        }

        event(new RoomStateUpdated($roomId, __('game.reconnected', ['player' => $playerName])));

        // Penalización por haber caído
        Redis::hset($playerTurnStateKey, 'skip_next_turn', 1);

        $role = $playerData['role'] ?? '';
        $needToResumeTimer = false;

        // 1. Si el Jefe Original vuelve
        if ($role === 'boss') {
            Log::info("ReconnectionService.php::handleReconnection: El jefe {$playerName} se reconectó, ejecutando DisconnectionService::handleBossReconnection\n");
            $this->handleBossReconnection($roomId);
            $needToResumeTimer = true;
        }

        // 2. Si el Becario (Jefe Heredado) vuelve antes de que expire su gracia
        $actingGraceValue = Redis::get("room:{$roomId}:acting_boss_grace_period");
        if ($actingGraceValue === $playerName) {
            Log::info("ReconnectionService.php::handleReconnection - El jugador (como jefe heredado) {$playerName} se reconectó, ejecutando restoreInternGrace\n");
            $this->restoreInternGrace($roomId, $playerName, $playerInfoKey);
            $needToResumeTimer = true;
        }

        // 3. Si el Secretario vuelve, prioriza sobre el Becario
        if ($role === 'secretary') {
            Log::info("ReconnectionService.php::handleReconnection - El secretario {$playerName} se reconectó, ejecutando evaluateSecretaryReturn\n");
            $this->evaluateSecretaryReturn($roomId, $playerInfoKey);
        }

        // 4. Si alguien vuelve durante la ending grace period, cancelarla
        if (Redis::exists("room:{$roomId}:ending_grace_period")) {
            Redis::del("room:{$roomId}:ending_grace_period");
            Log::info("ReconnectionService.php::handleReconnection - ending grace period cancelada por reconexión de {$playerName}");
            $needToResumeTimer = true;
        }

        if ($needToResumeTimer) {
            // Comprobamos si el turno estaba congelado
            $expiresAt = (int) Redis::hget("room:{$roomId}:state", 'turn_expires_at');

            if ($expiresAt === 0) {
                Log::info("ReconnectionService.php: Reactivando el temporizador de turno en sala $roomId tras reconexión.");
                $this->turnService->resumeTurnTimer($roomId);
                event(new RoomStateUpdated($roomId));
            }
        }
    }

    private function restoreInternGrace(string $roomId, string $playerName, string $playerInfoKey): void
    {
        Redis::del("room:{$roomId}:acting_boss_grace_period");

        // Se le devuelve el cargo
        Redis::hset($playerInfoKey, 'acting_boss', 1);

        $players = Redis::smembers("room:{$roomId}:players");
        foreach ($players as $pName) {
            if ($pName === $playerName) continue;

            $pInfoKey = "room:{$roomId}:player:{$pName}:info";
            $pData = Redis::hgetall($pInfoKey);

            if (($pData['role'] ?? '') === 'intern' && ($pData['acting_boss'] ?? '0') === '1') {
                // Se le quita el cargo
                Redis::hset($pInfoKey, 'acting_boss', 0);
            }
        }

        event(new RoomStateUpdated($roomId));
    }

    private function evaluateSecretaryReturn(string $roomId, string $playerInfoKey): void
    {
        $bossStillOffline = false;
        $players = Redis::smembers("room:{$roomId}:players");

        foreach ($players as $pName) {
            $pInfoKey = "room:{$roomId}:player:{$pName}:info";
            $pData = Redis::hgetall($pInfoKey);

            if (($pData['role'] ?? '') === 'boss' && ($pData['is_online'] ?? '1') === '0') {
                $bossStillOffline = true;
                break;
            }
        }

        if ($bossStillOffline) {
            foreach ($players as $pName) {
                $pInfoKey = "room:{$roomId}:player:{$pName}:info";
                $pData = Redis::hgetall($pInfoKey);

                if (($pData['role'] ?? '') === 'intern' && ($pData['acting_boss'] ?? '0') === '1') {
                    // Quitar el cargo al becario
                    Redis::hset($pInfoKey, 'acting_boss', 0);
                }
            }

            // Dar rol al secretario
            Redis::hset($playerInfoKey, 'acting_boss', 1);
            event(new RoomStateUpdated($roomId));
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
            $pInfoKey = "room:{$roomId}:player:{$name}:info";

            if (Redis::hget($pInfoKey, 'acting_boss') === '1') {
                Redis::hset($pInfoKey, 'acting_boss', 0);
            }
        }

        event(new RoomStateUpdated($roomId));
    }
}
