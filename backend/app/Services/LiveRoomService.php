<?php
// app/Services/LiveRoomService.php

namespace App\Services;

use App\Events\RoomListUpdated;
use App\Events\RoomStateUpdated;
use App\Exceptions\GameException;
use App\Exceptions\RoomException;
use App\Jobs\CheckVictoryJob;
use App\Services\LiveGame\DisconnectionService;
use App\Services\LiveGame\GameFinalizationService;
use App\Services\LiveGame\LiveGameService;
use App\Services\LiveGame\ReconnectionService;
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
        $roomKey = "room:{$roomId}";

        if (!Redis::exists($roomKey)) {
            throw new RoomException(RoomException::ROOM_NOT_FOUND, "The room does not exist.", 404);
        }

        $room = Redis::hgetall($roomKey);
        $alreadyInRoom = Redis::sismember("{$roomKey}:players", $playerName);

        // Si es un jugador nuevo entrando...
        if (!$alreadyInRoom) {
            $this->validateNewPlayerEntry($room, $roomId, $playerName, $password);

            Redis::sadd("{$roomKey}:players", $playerName);
            event(new RoomListUpdated($roomId));
            event(new RoomStateUpdated($roomId));
        }
        // Si ya estaba en la sala y la partida está en curso (Reconexión)...
        else if ($room['status'] === 'in_game') {
            $playerData = Redis::hgetall("room:{$roomId}:player:{$playerName}");
            $this->reconnectionService->handleReconnection($roomId, $playerName, $playerData);
            event(new RoomStateUpdated($roomId));
        }

        $gameToken = $this->tokenService->refreshPlayerToken($roomId, $playerName);

        return [
            'message' => $alreadyInRoom ? 'Reconnected.' : 'Joined.',
            'room_id' => $roomId,
            'player' => $playerName,
            'game_token' => $gameToken
        ];
    }

    public function leaveRoom(string $roomId, string $playerName): void
    {
        $roomKey = "room:{$roomId}";
        $room = Redis::hgetall($roomKey);

        if (empty($room)) {
            throw new RoomException(RoomException::ROOM_NOT_FOUND, "The room with ID {$roomId} does not exist.", 404);
        }

        if (!Redis::sismember("{$roomKey}:players", $playerName)) {
            throw new RoomException(RoomException::NOT_IN_ROOM, "Player {$playerName} is not in this room.", 409);
        }

        Log::info("El jugador {$playerName} abandonó la sala {$roomId}\n");

        // Derivar según el estado de la sala
        if ($room['status'] === 'in_game') {
            $this->disconnectionService->processInGameDisconnection($roomId, $playerName, $roomKey);
        } else {
            $this->processLobbyLeave($roomId, $playerName, $roomKey, $room);
        }
    }

    public function kickPlayer(string $roomId, string $adminName, string $playerToKick): void
    {
        $roomKey = "room:{$roomId}";
        $room = Redis::hgetall($roomKey);

        if (empty($room)) throw new RoomException(RoomException::ROOM_NOT_FOUND, "The room does not exist.", 404);
        if ($room['owner_name'] !== $adminName) throw new RoomException(RoomException::NOT_LEADER, "Only the room owner can kick players.", 403);
        if ($adminName === $playerToKick) throw new RoomException(RoomException::CANNOT_KICK_SELF, "You cannot kick yourself.", 422);
        if (!Redis::sismember("{$roomKey}:players", $playerToKick)) throw new RoomException(RoomException::NOT_IN_ROOM, "The player is not in the room.", 404);

        Redis::srem("{$roomKey}:players", $playerToKick);
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

    private function processLobbyLeave(string $roomId, string $playerName, string $roomKey, array $room): void
    {
        Redis::srem("{$roomKey}:players", $playerName);
        $this->tokenService->deletePlayerToken($roomId, $playerName);

        $remainingPlayersCount = Redis::scard("{$roomKey}:players");

        if ($remainingPlayersCount === 0) {
            $this->finalizationService->destroyRoom($roomId);
        } else {
            // Reasignar dueño si se va el admin
            if ($room['owner_name'] === $playerName) {
                $newOwner = Redis::srandmember("{$roomKey}:players");
                if ($newOwner) Redis::hset($roomKey, 'owner_name', $newOwner);
            }
            event(new RoomListUpdated($roomId));
            event(new RoomStateUpdated($roomId));
        }
    }
}
