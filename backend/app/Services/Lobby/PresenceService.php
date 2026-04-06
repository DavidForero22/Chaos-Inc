<?php
// app/Services/Lobby/PresenceService.php

namespace App\Services\Lobby;

use App\Services\Game\Status\DisconnectionService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;

class PresenceService
{
    public function __construct(
        protected DisconnectionService $disconnectionService,
        protected LiveRoomService $liveRoomService,
    ) {}

    public function markOffline(string $roomId, string $playerName): string
    {
        $roomStatus = Redis::hget("room:{$roomId}:state", 'status');
        if ($roomStatus !== 'in_game') {
            return 'ignored';
        }

        $isOnline = Redis::hget("room:{$roomId}:player:{$playerName}:info", 'is_online');

        // Si el jugador estaba online, procedemos con la desconexión oficial
        if ($isOnline === '1') {
            Log::info("PresenceService.php::markOffline - Los jugadores marcaron a {$playerName} como offline. Procesando desconexión...");

            $this->disconnectionService->processInGameDisconnection(
                $roomId,
                $playerName,
                "room:{$roomId}"
            );
        } else {
            Log::info("PresenceService.php::markOffline - Los jugadores marcaron a {$playerName} como offline, pero ya estaba offline.");
        }

        return 'marked offline';
    }

    public function processDisconnectReport(string $roomId, string $disconnectedPlayer): string
    {
        $isOnline = Redis::hget("room:{$roomId}:player:{$disconnectedPlayer}:info", 'is_online');

        // Si está online ('1'), procesar la caída porque el testigo sabe más que nosotros
        if ($isOnline === '1') {
            Log::info("PresenceService.php::processDisconnectReport - Jugador reportó la caída de {$disconnectedPlayer}. Procesando desconexión...");
            $this->disconnectionService->processInGameDisconnection(
                $roomId,
                $disconnectedPlayer,
                "room:{$roomId}"
            );
            return 'reported';
        }

        // Si ya era '0', significa que mark-offline ya hizo su trabajo
        Log::info("PresenceService.php:: processDisconnectReport: {$disconnectedPlayer} ya estaba offline, nada que hacer.");
        return 'already_offline';
    }

    public function processLobbyDisconnectReport(string $roomId, string $disconnectedPlayer): string
    {
        $roomStatus = Redis::hget("room:{$roomId}:state", 'status');
        if ($roomStatus !== 'waiting') {
            return 'ignored';
        }

        try {
            $this->liveRoomService->leaveRoom($roomId, $disconnectedPlayer);
        } catch (\Throwable $e) {
            // Si ya no estaba en la sala, ignorar
        }

        return 'reported';
    }

    public function handleReverbWebhook(array $payload): void
    {
        $eventType = $payload['type'] ?? null;
        $data = $payload['data'] ?? [];

        Log::info("Reverb webhook recibido: {$eventType}", $data);

        if ($eventType === 'member_removed') {
            $roomId = str_replace('presence-room.', '', $data['channel'] ?? '');
            $username = $data['user_info']['username'] ?? null;

            if ($roomId && $username) {
                $isOnline = Redis::hget("room:{$roomId}:player:{$username}:info", 'is_online');

                if ($isOnline !== '1') {
                    Log::info("Webhook Reverb: procesando caída de {$username} en sala {$roomId}");
                    $this->disconnectionService->processInGameDisconnection(
                        $roomId,
                        $username,
                        "room:{$roomId}"
                    );
                }
            }
        }
    }
}
