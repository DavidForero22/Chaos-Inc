<?php

namespace App\Services;

use App\Events\RoomStateUpdated;
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
}
