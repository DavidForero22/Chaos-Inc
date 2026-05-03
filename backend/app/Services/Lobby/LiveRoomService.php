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
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class LiveRoomService
{
    public function __construct(
        protected GameFinalizationService $finalizationService,
        protected TokenService $tokenService,
        protected DisconnectionService $disconnectionService,
        protected ReconnectionService $reconnectionService,
    ) {}

    public function joinRoom(string $roomId, string $playerName, ?string $password = null): array
    {
        $currentRoom = Redis::get("player:{$playerName}:room");

        // Si el jugador ya está en otra sala distinta a la que intenta entrar
        if ($currentRoom && $currentRoom !== $roomId) {
            throw new \Exception("Ya estás en otra partida en curso (Sala: {$currentRoom}).", 400);
        }

        $roomInfoKey  = "room:{$roomId}:info";
        $roomStateKey = "room:{$roomId}:state";

        // Si la sala a la que intenta entrar ya no existe...
        if (!Redis::exists($roomInfoKey)) {
            // Si el servidor creía que el jugador estaba en esta sala fantasma, quitar la relacción
            if ($currentRoom === $roomId) {
                Redis::del("player:{$playerName}:room");
            }
            throw new \Exception("La sala no existe o la partida ha finalizado.", 404);
        }

        $roomInfo  = Redis::hgetall($roomInfoKey);
        $roomState = Redis::hgetall($roomStateKey);
        $room      = array_merge($roomInfo, $roomState);

        $alreadyInRoom = Redis::sismember("room:{$roomId}:players", $playerName);

        // Si es un jugador nuevo entrando...
        if (!$alreadyInRoom) {
            $this->validateNewPlayerEntry($room, $roomId, $playerName, $password);

            Redis::sadd("room:{$roomId}:players", $playerName);
            Redis::setex("player:{$playerName}:room", 86400, $roomId);

            event(new RoomListUpdated($roomId));
            event(new RoomStateUpdated($roomId));
        }

        // Si ya estaba en la sala y la partida está en curso (Reconexión)...
        else if ($room['status'] === 'in_game') {
            $playerData = Redis::hgetall("room:{$roomId}:player:{$playerName}:info");
            $this->reconnectionService->handleReconnection($roomId, $playerName, $playerData);
            Redis::setex("player:{$playerName}:room", 86400, $roomId);
        }

        $gameToken = $this->tokenService->refreshPlayerToken($roomId, $playerName);

        return [
            'message'    => $alreadyInRoom ? 'Reconnected.' : 'Joined.',
            'room_id'    => $roomId,
            'player'     => $playerName,
            'game_token' => $gameToken
        ];
    }

    public function leaveRoom(string $roomId, string $playerName): void
    {
        $roomInfoKey  = "room:{$roomId}:info";
        $roomStateKey = "room:{$roomId}:state";
        Redis::del("player:{$playerName}:room");

        if (!Redis::exists($roomInfoKey)) {
            throw new RoomException(RoomException::ROOM_NOT_FOUND, "The room with ID {$roomId} does not exist.", 404);
        }

        $roomInfo  = Redis::hgetall($roomInfoKey);
        $roomState = Redis::hgetall($roomStateKey);
        $room      = array_merge($roomInfo, $roomState);

        if (!Redis::sismember("room:{$roomId}:players", $playerName)) {
            throw new RoomException(RoomException::NOT_IN_ROOM, "Player {$playerName} is not in this room.", 409);
        }

        Log::info("LiveRoomService.php::leaveRoom - El jugador {$playerName} abandonó la sala {$roomId}\n");

        // Derivar según el estado de la sala
        if ($room['status'] === 'in_game') {
            // Grace period de 4s para cubrir F5/reconexiones rápidas
            $disconnectKey = "room:{$roomId}:disconnecting:{$playerName}";

            if (!Redis::exists($disconnectKey)) {
                Redis::setex($disconnectKey, 10, 'pending');

                $playerId = Redis::hget("room:{$roomId}:player:{$playerName}:info", 'user_id');

                ProcessDisconnectionJob::dispatch($roomId, $playerId, $playerName)
                    ->delay(now()->addSeconds(4));
            }
        } else {
            $this->processLobbyLeave($roomId, $playerName, $room);
        }
    }

    public function kickPlayer(string $roomId, string $adminName, string $playerToKick): void
    {
        $roomInfoKey = "room:{$roomId}:info";

        if (!Redis::exists($roomInfoKey)) {
            throw new RoomException(RoomException::ROOM_NOT_FOUND, "The room does not exist.", 404);
        }

        $ownerName = Redis::hget($roomInfoKey, 'owner_name');

        if ($ownerName !== $adminName) throw new RoomException(RoomException::NOT_LEADER, "Only the room owner can kick players.", 403);
        if ($adminName === $playerToKick) throw new RoomException(RoomException::CANNOT_KICK_SELF, "You cannot kick yourself.", 422);
        if (!Redis::sismember("room:{$roomId}:players", $playerToKick)) throw new RoomException(RoomException::NOT_IN_ROOM, "The player is not in the room.", 404);

        Redis::srem("room:{$roomId}:players", $playerToKick);
        $this->tokenService->deletePlayerToken($roomId, $playerToKick);

        event(new RoomListUpdated($roomId));
        event(new RoomStateUpdated($roomId));
    }

    // =========================================================================
    // MÉTODOS PRIVADOS DE VALIDACIÓN Y PROCESAMIENTO
    // =========================================================================

    private function validateNewPlayerEntry(array $room, string $roomId, string $playerName, ?string $password): void
    {
        $this->ensurePlayerNotInOtherRooms($playerName, $roomId);

        if ($room['status'] === 'in_game') {
            throw new GameException(GameException::GAME_ALREADY_STARTED, "The game has already begun.", 403);
        }

        if ($room['is_private'] === '1') {
            if (!$password) throw new RoomException(RoomException::PASSWORD_REQUIRED, "Password required.", 403);
            if (!Hash::check($password, $room['password'])) throw new RoomException(RoomException::INCORRECT_PASSWORD, "Incorrect password.", 403);
        }

        $currentPlayersCount = Redis::scard("room:{$roomId}:players");
        if ($currentPlayersCount >= $room['max_players']) {
            throw new RoomException(RoomException::ROOM_FULL, "The room is full.", 409);
        }
    }

    private function ensurePlayerNotInOtherRooms(string $playerName, string $currentRoomId): void
    {
        $activeRooms = Redis::smembers("active_rooms");
        foreach ($activeRooms as $activeRoomId) {
            if ($activeRoomId !== $currentRoomId && Redis::sismember("room:{$activeRoomId}:players", $playerName)) {
                throw new RoomException(
                    RoomException::ALREADY_IN_ANOTHER_ROOM,
                    "You are already in another game. Finish or quit the current one first.",
                    403
                );
            }
        }
    }

    private function processLobbyLeave(string $roomId, string $playerName, array $room): void
    {
        Redis::srem("room:{$roomId}:players", $playerName);
        $this->tokenService->deletePlayerToken($roomId, $playerName);

        $remainingPlayersCount = Redis::scard("room:{$roomId}:players");

        if ($remainingPlayersCount === 0) {
            $this->finalizationService->destroyRoom($roomId);
        } else {
            // Reasignar dueño si se va el admin
            if ($room['owner_name'] === $playerName) {
                $newOwner = Redis::srandmember("room:{$roomId}:players");
                if ($newOwner) {
                    Redis::hset("room:{$roomId}:info", 'owner_name', $newOwner);
                }
            }
            event(new RoomListUpdated($roomId));
            event(new RoomStateUpdated($roomId));
        }
    }
}
