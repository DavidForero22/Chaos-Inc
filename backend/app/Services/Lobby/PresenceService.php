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
        // 1. Verificar que quien reporta está realmente en la sala
        $reporterUsername = request()->user()?->username;
        if (!$reporterUsername) {
            return 'unauthorized';
        }

        $reporterOnline = Redis::hget("room:{$roomId}:player:{$reporterUsername}:info", 'is_online');
        if ($reporterOnline !== '1') {
            Log::warning("PresenceService: {$reporterUsername} intentó reportar a {$disconnectedPlayer} pero no está en la partida.");
            return 'unauthorized';
        }

        // 2. Si el jugador reportado ya está offline, nada que hacer
        $isOnline = Redis::hget("room:{$roomId}:player:{$disconnectedPlayer}:info", 'is_online');
        if ($isOnline !== '1') {
            return 'already_offline';
        }

        // 3. Registrar el voto de este jugador (TTL de 30s para limpiar votos caducados)
        $voteKey = "room:{$roomId}:disconnect_votes:{$disconnectedPlayer}";
        Redis::sadd($voteKey, $reporterUsername);
        Redis::expire($voteKey, 30);

        $votes = Redis::scard($voteKey);

        // 4. Calcular quórum: todos los jugadores online excepto el reportado
        $playerKeys = Redis::keys("room:{$roomId}:player:*:info");
        $onlinePlayers = collect($playerKeys)->filter(function ($key) use ($roomId, $disconnectedPlayer) {
            $name = $this->extractPlayerName($key, $roomId);
            if ($name === $disconnectedPlayer) return false;
            return Redis::hget($key, 'is_online') === '1';
        });

        $quorum = max(1, $onlinePlayers->count()); // Al menos 1 voto

        Log::info("PresenceService: {$votes}/{$quorum} votos para desconectar a {$disconnectedPlayer}.");

        if ($votes >= $quorum) {
            Redis::del($voteKey);
            Log::info("PresenceService: Quórum alcanzado. Procesando desconexión de {$disconnectedPlayer}.");
            $this->disconnectionService->processInGameDisconnection(
                $roomId,
                $disconnectedPlayer,
                "room:{$roomId}"
            );
            return 'reported';
        }

        return 'vote_registered';
    }

    private function extractPlayerName(string $key, string $roomId): string
    {
        // "room:{roomId}:player:{name}:info" → "{name}"
        $prefix = "room:{$roomId}:player:";
        $suffix = ":info";
        return str_replace([$prefix, $suffix], '', $key);
    }


    public function processLobbyDisconnectReport(string $roomId, string $disconnectedPlayer): string
    {
        $roomStatus = Redis::hget("room:{$roomId}:state", 'status');
        if ($roomStatus !== 'waiting') {
            return 'ignored';
        }

        // Verificar que el reporter está en el lobby
        $reporterUsername = request()->user()?->username;
        $lobbyMembers = Redis::smembers("room:{$roomId}:players"); // ajusta según tu estructura
        if (!$reporterUsername || !in_array($reporterUsername, $lobbyMembers)) {
            return 'unauthorized';
        }

        // Sistema de votos igual que en partida
        $voteKey = "room:{$roomId}:lobby_disconnect_votes:{$disconnectedPlayer}";
        Redis::sadd($voteKey, $reporterUsername);
        Redis::expire($voteKey, 30);

        $votes = Redis::scard($voteKey);
        $quorum = max(1, count($lobbyMembers) - 1);

        if ($votes >= $quorum) {
            Redis::del($voteKey);
            try {
                $this->liveRoomService->leaveRoom($roomId, $disconnectedPlayer);
            } catch (\Throwable $e) {
            }
            return 'reported';
        }

        return 'vote_registered';
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
