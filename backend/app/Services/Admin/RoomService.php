<?php
// app/Services/Admin/RoomService.php

namespace App\Services\Admin;

use App\Events\RoomListUpdated;
use App\Events\RoomStateUpdated;
use App\Exceptions\RoomException;
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

    public function getRoom(string $roomId): ?array
    {
        $roomKey = "room:{$roomId}";

        if (!Redis::exists($roomKey)) {
            throw new RoomException(RoomException::ROOM_NOT_FOUND, "The room does not exist.", 404);
        }

        $room = Redis::hgetall($roomKey);
        $room['players'] = Redis::smembers("{$roomKey}:players");

        return $room;
    }

    public function createRoom(array $data, ?string $ownerName): array
    {
        $roomId = Str::upper(Str::random(6));
        $gameToken = (string) Str::uuid();

        $roomData = [
            'room_id' => $roomId,
            'name' => $data['name'],
            'is_private' => $data['is_private'] ? '1' : '0',
            'password' => $data['is_private'] ? Hash::make($data['password']) : '',
            'max_players' => $data['max_players'],
            'status' => 'waiting',
            'owner_name' => $ownerName,
        ];

        // Guardar en Redis
        Redis::hmset("room:{$roomId}", $roomData);
        Redis::sadd("active_rooms", $roomId);
        Redis::expire("room:{$roomId}", 86400); // 24h

        // Añadir datos
        Redis::sadd("room:{$roomId}:players", $ownerName);
        Redis::setex("room:{$roomId}:token:{$gameToken}", 86400, $ownerName);
        Redis::expire("room:{$roomId}:players", 86400);

        // Avisar al Menú Principal para que aparezca la nueva sala.
        event(new RoomListUpdated($roomId)); 
        // Pasar el $roomId requerido al evento de estado.
        event(new RoomStateUpdated($roomId));

        $roomData['players'] = [$ownerName];
        $roomData['game_token'] = $gameToken;
        unset($roomData['password']);

        return $roomData;
    }
}
