<?php

namespace App\Services;

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

        return $roomData;
    }
}
