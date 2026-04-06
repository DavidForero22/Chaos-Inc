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
            $infoData = Redis::hgetall("room:{$id}:info");
            $stateData = Redis::hgetall("room:{$id}:state");

            if (!empty($infoData)) {
                $roomData = array_merge($infoData, $stateData);
                $roomData['room_id'] = $id;

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
        $infoKey = "room:{$roomId}:info";
        $stateKey = "room:{$roomId}:state";

        if (!Redis::exists($infoKey)) {
            throw new RoomException(RoomException::ROOM_NOT_FOUND, "The room does not exist.", 404);
        }

        $infoData = Redis::hgetall($infoKey);
        $stateData = Redis::hgetall($stateKey);

        $room = array_merge($infoData, $stateData);
        $room['room_id'] = $roomId;
        $room['players'] = Redis::smembers("room:{$roomId}:players");

        return $room;
    }

    public function createRoom(array $data, ?string $ownerName): array
    {
        $roomId = Str::upper(Str::random(6));
        $gameToken = (string) Str::uuid();

        $infoData = [
            'name' => $data['name'],
            'owner_name' => $ownerName,
            'is_private' => $data['is_private'] ? '1' : '0',
            'password' => $data['is_private'] ? Hash::make($data['password']) : '',
            'max_players' => $data['max_players'],
            'turn_timeout' => $data['turn_timeout'],
        ];

        $stateData = [
            'status' => 'waiting',
        ];

        Redis::hmset("room:{$roomId}:info", $infoData);
        Redis::hmset("room:{$roomId}:state", $stateData);

        Redis::sadd("active_rooms", $roomId);

        // Expiraciones
        Redis::expire("room:{$roomId}:info", 86400); // 24h
        Redis::expire("room:{$roomId}:state", 86400);

        // Añadir jugadores y tokens
        Redis::sadd("room:{$roomId}:players", $ownerName);
        Redis::setex("room:{$roomId}:token:{$gameToken}", 86400, $ownerName);
        Redis::expire("room:{$roomId}:players", 86400);

        event(new RoomListUpdated($roomId));
        event(new RoomStateUpdated($roomId));

        // Preparar la respuesta fusionando los datos y limpiando info sensible
        $roomDataResponse = array_merge($infoData, $stateData);
        $roomDataResponse['room_id'] = $roomId;
        $roomDataResponse['players'] = [$ownerName];
        $roomDataResponse['game_token'] = $gameToken;
        unset($roomDataResponse['password']);

        return $roomDataResponse;
    }
}
