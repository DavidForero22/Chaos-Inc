<?php

namespace App\Services;

use App\Events\RoomListUpdated;
use App\Events\RoomStateUpdated;
use App\Exceptions\GameException;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Hash;

class LiveRoomService
{
    public function joinRoom(string $roomId, string $playerName, ?string $password = null): array
    {
        $roomKey = "room:{$roomId}";

        if (!Redis::exists($roomKey)) {
            throw new GameException(GameException::ROOM_NOT_FOUND, "The room does not exist.", 404);
        }

        $room = Redis::hgetall($roomKey);

        if (Redis::sismember("{$roomKey}:players", $playerName)) {
            throw new GameException(GameException::ALREADY_IN_ROOM, "You are already in the room.", 409);
        }

        if ($room['status'] !== 'waiting') {
            throw new GameException(GameException::GAME_ALREADY_STARTED, "The game has already begun.", 403);
        }

        if ($room['is_private'] === '1') {
            if (!$password) {
                throw new GameException(GameException::PASSWORD_REQUIRED, "Password required.", 403);
            }

            if (!Hash::check($password, $room['password'])) {
                throw new GameException(GameException::INCORRECT_PASSWORD, "Incorrect password.", 403);
            }
        }

        $currentPlayersCount = Redis::scard("{$roomKey}:players");
        if ($currentPlayersCount >= $room['max_players']) {
            throw new GameException(GameException::ROOM_FULL, "The room is full.", 409);
        }

        // Añadir jugador
        Redis::sadd("{$roomKey}:players", $playerName);

        // Avisar a los que ya están en la sala de que ha entrado alguien
        event(new RoomListUpdated($roomId));

        // Avisar al menú principal para que actualice el contador (X/4)
        event(new RoomStateUpdated());

        return [
            'message' => 'You have joined the room.',
            'room_id' => $roomId,
            'player' => $playerName
        ];
    }

    public function leaveRoom(string $roomId, string $playerName): void
    {
        $roomKey = "room:{$roomId}";
        $room = Redis::hgetall($roomKey);

        if (empty($room)) {
            throw new GameException(GameException::ROOM_NOT_FOUND, "The room with ID {$roomId} does not exist.", 404);
        }

        if (!Redis::sismember("{$roomKey}:players", $playerName)) {
            throw new GameException(GameException::NOT_IN_ROOM, "Player {$playerName} is not in this room.", 409);
        }

        // Eliminar al usuario de la sala
        Redis::srem("{$roomKey}:players", $playerName);
        $remainingPlayers = Redis::scard("{$roomKey}:players");

        // Si no quedan jugadores, borrar sala
        if ($remainingPlayers === 0) {
            Redis::del($roomKey);
            Redis::del("{$roomKey}:players");
            Redis::srem("active_rooms", $roomId);
        } else {
            event(new RoomListUpdated($roomId));
        }

        event(new RoomStateUpdated());
    }
}
