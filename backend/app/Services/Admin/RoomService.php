<?php
// app/Services/Admin/RoomService.php

namespace App\Services\Admin;

use App\Events\RoomListUpdated;
use App\Events\RoomStateUpdated;
use App\Exceptions\RoomException;
use App\Support\CastHelper;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;

class RoomService
{
    public function getAllRooms(): array
    {
        $roomIds = Redis::smembers('active_rooms');

        if (empty($roomIds)) {
            return [];
        }

        // Enviar todas las consultas a Redis en un solo viaje
        $results = Redis::pipeline(function ($pipe) use ($roomIds) {
            foreach ($roomIds as $id) {
                $pipe->hgetall("room:{$id}:info");
                $pipe->hgetall("room:{$id}:state");
                $pipe->smembers("room:{$id}:players");
            }
        });

        $rooms = [];
        $index = 0;

        // Procesar los resultados que devolvió el Pipeline
        foreach ($roomIds as $id) {
            $infoData = $results[$index];
            $stateData = $results[$index + 1];
            $players = $results[$index + 2];

            // Avanzar el índice de 3 en 3 (porque hicimos 3 consultas por sala)
            $index += 3;

            if (!empty($infoData)) {
                $roomData = array_merge($infoData, $stateData);
                $roomData['room_id'] = $id;

                unset($roomData['password']);

                $roomData['players'] = $players;

                $rooms[] = $roomData;
            }
        }

        return $rooms;
    }

    public function getRoom(string $roomId): array 
    {
        // Usar un pipeline para pedir todo a Redis de un solo golpe
        $responses = Redis::pipeline(function ($pipe) use ($roomId) {
            $pipe->hgetall("room:{$roomId}:info");
            $pipe->hgetall("room:{$roomId}:state");
            $pipe->smembers("room:{$roomId}:players");
        });

        [$infoData, $stateData, $players] = $responses;

        // Si infoData está vacío, la sala no existe
        if (empty($infoData)) {
            throw new RoomException(RoomException::ROOM_NOT_FOUND, "La sala no existe.", 404);
        }

        // Construir el resultado
        $room = array_merge($infoData, $stateData);
        $room['room_id'] = $roomId;
        $room['players'] = $players;

        if (isset($room['is_private'])) {
            $room['is_private'] = CastHelper::toBool($room['is_private']);
        }

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
