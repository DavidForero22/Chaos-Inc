<?php
// app/Services/Lobby/LiveRoomService.php

namespace App\Services\Lobby;

use App\Events\RoomListUpdated;
use App\Events\RoomStateUpdated;
use App\Exceptions\GameException;
use App\Exceptions\RoomException;
use App\Jobs\ProcessDisconnectionJob;
use App\Services\Auth\TokenService;
use App\Services\Game\Status\DisconnectionService;
use App\Services\Game\Status\GameFinalizationService;
use App\Services\Game\Status\ReconnectionService;
use App\Support\RoomLogger;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Hash;

class LiveRoomService
{
    public function __construct(
        protected GameFinalizationService $finalizationService,
        protected TokenService $tokenService,
        protected DisconnectionService $disconnectionService,
        protected ReconnectionService $reconnectionService,
    ) {}

    public function joinRoom(string $roomId, string $playerId, string $playerName, ?string $password = null): array
    {
        $currentRoom = Redis::get("player:{$playerId}:room");

        // Si el jugador ya está en otra sala distinta a la que intenta entrar
        if ($currentRoom && $currentRoom !== $roomId) {
            throw new RoomException(
                RoomException::ALREADY_IN_ANOTHER_ROOM,
                "Ya estás en otra partida en curso (Sala: {$currentRoom}).",
                400
            );
        }

        $roomInfoKey  = "room:{$roomId}:info";
        $roomStateKey = "room:{$roomId}:state";

        // Si la sala a la que intenta entrar ya no existe...
        if (!Redis::exists($roomInfoKey)) {
            if ($currentRoom === $roomId) {
                Redis::del("player:{$playerId}:room");
            }
            throw new RoomException(
                RoomException::ROOM_NOT_FOUND,
                "La sala no existe o la partida ha finalizado.",
                404
            );
        }

        $roomInfo  = Redis::hgetall($roomInfoKey);
        $roomState = Redis::hgetall($roomStateKey);
        $room      = array_merge($roomInfo, $roomState);

        RoomLogger::info($roomId, "LiveRoomService.php::joinRoom", [
            'playerId' => $playerId,
            'roomInfo keys' => array_keys($roomInfo),
            'owner_id from roomInfo' => $roomInfo['owner_id'] ?? 'NO EXISTE',
        ]);

        $alreadyInRoom = Redis::sismember("room:{$roomId}:players", $playerId);

        // Si es un jugador nuevo entrando...
        if (!$alreadyInRoom) {
            $this->validateNewPlayerEntry($room, $roomId, $playerId, $password);

            Redis::sadd("room:{$roomId}:players", $playerId);
            Redis::setex("player:{$playerId}:room", 86400, $roomId);

            $isGuest = !is_numeric($playerId);
            $playerInfoToSave = [
                'username' => $playerName,
                'user_id'  => $isGuest ? '' : $playerId,
                'avatar'   => ''
            ];

            Redis::hmset("room:{$roomId}:player:{$playerId}:info", $playerInfoToSave);

            event(new RoomListUpdated($roomId));
            event(new RoomStateUpdated($roomId));
        }

        // Si ya estaba en la sala y la partida está en curso (Reconexión)...
        else if ($room['status'] === 'in_game') {
            $playerData = Redis::hgetall("room:{$roomId}:player:{$playerId}:info");
            $this->reconnectionService->handleReconnection($roomId, $playerId, $playerData);
            Redis::setex("player:{$playerId}:room", 86400, $roomId);
        }

        $gameToken = $this->tokenService->refreshPlayerToken($roomId, $playerId);

        return [
            'message'    => $alreadyInRoom ? 'Reconnected.' : 'Joined.',
            'room_id'    => $roomId,
            'player_id'  => $playerId,
            'game_token' => $gameToken
        ];
    }

    public function leaveRoom(string $roomId, string $playerId): void
    {
        $roomInfoKey  = "room:{$roomId}:info";
        $roomStateKey = "room:{$roomId}:state";

        // Quitar la relación global antes de validar
        Redis::del("player:{$playerId}:room");

        if (!Redis::exists($roomInfoKey)) {
            throw new RoomException(RoomException::ROOM_NOT_FOUND, "La sala con ID {$roomId} no existe.", 404);
        }

        if (!Redis::sismember("room:{$roomId}:players", $playerId)) {
            throw new RoomException(RoomException::NOT_IN_ROOM, "El jugador {$playerId} no está en esta sala.", 409);
        }

        // Obtener nombre para el log
        $playerName = Redis::hget("room:{$roomId}:player:{$playerId}:info", 'username') ?? "ID_{$playerId}";
        RoomLogger::info($roomId, "LiveRoomService.php::leaveRoom: El jugador {$playerName} ({$playerId}) abandonó la sala.");
        $room = array_merge(Redis::hgetall($roomInfoKey), Redis::hgetall($roomStateKey));

        if ($room['status'] === 'in_game') {
            $disconnectKey = "room:{$roomId}:disconnecting:{$playerId}";

            if (!Redis::exists($disconnectKey)) {
                Redis::setex($disconnectKey, 10, 'pending');

                ProcessDisconnectionJob::dispatch($roomId, $playerId)
                    ->delay(now('UTC')->addSeconds(4));
            }
        } else {
            $this->processLobbyLeave($roomId, $playerId, $room);
        }
    }

    public function kickPlayer(string $roomId, string $adminId, string $playerToKickId): void
    {
        $roomInfoKey = "room:{$roomId}:info";

        if (!Redis::exists($roomInfoKey)) {
            throw new RoomException(RoomException::ROOM_NOT_FOUND, "La sala no existe.", 404);
        }

        $ownerId = (string) Redis::hget($roomInfoKey, 'owner_id');
        $adminId = (string) $adminId;

        if ($ownerId !== $adminId) {
            throw new RoomException(RoomException::NOT_LEADER, "Solo el lider de la sala puede expulsar a jugadores.", 403);
        }

        if ($adminId === $playerToKickId) {
            throw new RoomException(RoomException::CANNOT_KICK_SELF, "No te puedes expulsar a ti mismo.", 422);
        }

        if (!Redis::sismember("room:{$roomId}:players", (string) $playerToKickId)) {
            throw new RoomException(RoomException::NOT_IN_ROOM, "El jugador a expulsar no está en la sala.", 404);
        }

        Redis::srem("room:{$roomId}:players", $playerToKickId);
        Redis::del("player:{$playerToKickId}:room");
        $this->tokenService->deletePlayerToken($roomId, $playerToKickId);

        event(new RoomListUpdated($roomId));
        event(new RoomStateUpdated(
            roomId: $roomId,
            kickedPlayerId: $playerToKickId
        ));
    }

    // =========================================================================
    // MÉTODOS PRIVADOS DE VALIDACIÓN Y PROCESAMIENTO
    // =========================================================================

    private function validateNewPlayerEntry(array $room, string $roomId, string $playerId, ?string $password): void
    {
        $this->ensurePlayerNotInOtherRooms($playerId, $roomId);

        if ($room['status'] === 'in_game') {
            throw new GameException(GameException::GAME_ALREADY_STARTED, "La partida ya ha empezado.", 403);
        }

        if ($room['is_private'] === '1') {
            if (!$password) throw new RoomException(RoomException::PASSWORD_REQUIRED, "Esta sala está protegida con contraseña.", 403);
            if (!Hash::check($password, $room['password'])) throw new RoomException(RoomException::INCORRECT_PASSWORD, "Contraseña incorrecta.", 403);
        }

        $currentPlayersCount = Redis::scard("room:{$roomId}:players");
        if ($currentPlayersCount >= $room['max_players']) {
            throw new RoomException(RoomException::ROOM_FULL, "La sala está llena.", 409);
        }
    }

    private function ensurePlayerNotInOtherRooms(string $playerId, string $currentRoomId): void
    {
        $activeRooms = Redis::smembers("active_rooms");
        foreach ($activeRooms as $activeRoomId) {
            if ($activeRoomId !== $currentRoomId && Redis::sismember("room:{$activeRoomId}:players", $playerId)) {
                throw new RoomException(
                    RoomException::ALREADY_IN_ANOTHER_ROOM,
                    "Ya estás en otra sala/partida.",
                    403
                );
            }
        }
    }

    private function processLobbyLeave(string $roomId, string $playerId, array $room): void
    {
        Redis::srem("room:{$roomId}:players", $playerId);
        $this->tokenService->deletePlayerToken($roomId, $playerId);

        $remainingPlayersCount = Redis::scard("room:{$roomId}:players");

        if ($remainingPlayersCount === 0) {
            $this->finalizationService->destroyRoom($roomId);
        } else {
            // Reasignar dueño si se va el admin 
            if ($room['owner_id'] === $playerId) {
                $newOwnerId = Redis::srandmember("room:{$roomId}:players");
                if ($newOwnerId) {
                    Redis::hset("room:{$roomId}:info", 'owner_id', $newOwnerId);

                    $newOwnerName = Redis::hget("room:{$roomId}:player:{$newOwnerId}:info", 'username');
                    if ($newOwnerName) {
                        Redis::hset("room:{$roomId}:info", 'owner_name', $newOwnerName);
                    }
                }
            }
            event(new RoomListUpdated($roomId));
            event(new RoomStateUpdated($roomId));
        }
    }
}
