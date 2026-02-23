<?php

namespace App\Services;

use App\Events\RoomListUpdated;
use App\Events\RoomStateUpdated;
use App\Exceptions\GameException;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;

class RoomService
{
    public function getAllRooms(): array
    {
        $roomIds = Redis::smembers('active_rooms');
        $rooms = [];

        foreach ($roomIds as $id) {
            $roomData = Redis::hgetall("room:{$id}");
            if (!empty($roomData)) {
                unset($roomData['password']);

                $players = Redis::smembers("room:{$id}:players");
                $roomData['players'] = $players;

                $rooms[] = $roomData;
            }
        }

        return $rooms;
    }

    public function createRoom(array $data, ?string $ownerName): array
    {
        $roomId = Str::upper(Str::random(6));

        $roomData = [
            'room_id' => $roomId,
            'name' => $data['name'],
            'is_private' => $data['is_private'] ? '1' : '0',
            'password' => $data['is_private'] ? Hash::make($data['password']) : null,
            'max_players' => $data['max_players'],
            'status' => 'waiting',
            'owner_name' => $ownerName,
        ];

        // Guardamos en Redis
        Redis::hmset("room:{$roomId}", $roomData);
        Redis::sadd("active_rooms", $roomId);
        Redis::expire("room:{$roomId}", 86400); // 24h

        // Añadimos al creador como el primer jugador de la sala
        Redis::sadd("room:{$roomId}:players", $ownerName);
        Redis::expire("room:{$roomId}:players", 86400);

        // Avisar al Menú Principal de que hay una nueva sala
        event(new RoomStateUpdated());

        // Devolvemos los datos con el array de jugadores inicializado
        $roomData['players'] = [$ownerName];
        unset($roomData['password']);

        return $roomData;
    }

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
