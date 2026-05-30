<?php
// app/Services/Admin/RoomService.php

namespace App\Services\Admin;

use App\Events\RoomListUpdated;
use App\Events\RoomStateUpdated;
use App\Exceptions\RoomException;
use App\Http\Resources\RoomResource;
use App\Models\User;
use App\Services\Game\Engine\ExperienceService;
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

        // Primer pipeline: Info, Estado y lista de IDs de jugadores
        $results = Redis::pipeline(function ($pipe) use ($roomIds) {
            foreach ($roomIds as $id) {
                $pipe->hgetall("room:{$id}:info");
                $pipe->hgetall("room:{$id}:state");
                $pipe->smembers("room:{$id}:players");
            }
        });

        $roomsTemp = [];
        $index = 0;

        $playerLookups = [];

        // Procesar los resultados iniciales y preparar la búsqueda de nombres
        foreach ($roomIds as $id) {
            $infoData = $results[$index];
            $stateData = $results[$index + 1];
            $playerIds = $results[$index + 2];

            // Avanzar el índice de 3 en 3 (porque hay 3 consultas por sala)
            $index += 3;

            if (!empty($infoData)) {
                $roomData = array_merge($infoData, $stateData);
                $roomData['room_id'] = $id;
                unset($roomData['password']);

                // Guardar temporalmente los IDs para usarlos luego
                $roomData['player_ids'] = $playerIds;
                $roomsTemp[$id] = $roomData;

                // Preparar la lista de jugadores a los que hay que buscar el nombre
                foreach ($playerIds as $pid) {
                    $playerLookups[] = [
                        'roomId' => $id,
                        'playerId' => $pid
                    ];
                }
            }
        }

        if (empty($roomsTemp)) {
            return [];
        }

        // Segundo pipeline: Obtener todos los nombres de golpe
        $namesResult = [];
        if (!empty($playerLookups)) {
            $namesResult = Redis::pipeline(function ($pipe) use ($playerLookups) {
                foreach ($playerLookups as $lookup) {
                    $pipe->hget("room:{$lookup['roomId']}:player:{$lookup['playerId']}:info", 'username');
                }
            });
        }

        // Construir la respuesta final uniendo los nombres con sus salas
        $formattedRooms = [];
        $lookupIndex = 0;

        foreach ($roomsTemp as $roomId => $roomData) {
            $formattedPlayers = [];

            foreach ($roomData['player_ids'] as $pid) {
                // Rescatar el nombre del segundo pipeline
                $name = $namesResult[$lookupIndex] ?? false;
                $formattedPlayers[] = [
                    'id' => $pid,
                    'name' => $name ?: "ID_{$pid}"
                ];
                $lookupIndex++;
            }

            // Limpiar la clave temporal y asignamos los objetos definitivos
            unset($roomData['player_ids']);
            $roomData['players'] = $formattedPlayers;

            $formattedRooms[] = $roomData;
        }

        return $formattedRooms;
    }

    public function getRoom(string $roomId): array
    {
        // Usar un pipeline para pedir info general y la lista de IDs de un solo golpe
        $responses = Redis::pipeline(function ($pipe) use ($roomId) {
            $pipe->hgetall("room:{$roomId}:info");
            $pipe->hgetall("room:{$roomId}:state");
            $pipe->smembers("room:{$roomId}:players");
        });

        [$infoData, $stateData, $playerIds] = $responses;

        // Si infoData está vacío, la sala no existe
        if (empty($infoData)) {
            throw new RoomException(RoomException::ROOM_NOT_FOUND, "La sala no existe.", 404);
        }

        // Transformar los IDs en objetos [{id, name, avatar, level}]
        $formattedPlayers = [];
        if (!empty($playerIds)) {
            $namesResponse = Redis::pipeline(function ($pipe) use ($roomId, $playerIds) {
                foreach ($playerIds as $pid) {
                    $pipe->hmget("room:{$roomId}:player:{$pid}:info", ['username', 'avatar', 'user_id']);
                }
            });

            foreach ($playerIds as $index => $pid) {
                $playerInfo = $namesResponse[$index];
                $name   = $playerInfo['username'] ?? $playerInfo[0] ?? null;
                $avatar = $playerInfo['avatar']   ?? $playerInfo[1] ?? null;
                $userId = $playerInfo['user_id']  ?? $playerInfo[2] ?? null;

                $level = 1;

                // Si es un usuario registrado (no invitado), intenta sacar su nivel/avatar de BD si no estaba en la info de la sala.
                if ($userId) {
                    static $cache = [];
                    if (!array_key_exists($userId, $cache)) {
                        $user = \App\Models\User::select('avatar', 'total_xp')->find($userId);
                        $cache[$userId] = $user;
                    }

                    $userModel = $cache[$userId];
                    if ($userModel) {
                        if (!$avatar) $avatar = $userModel->avatar;
                        $level = ExperienceService::levelFromXp((int) $userModel->total_xp);
                    }
                }

                $formattedPlayers[] = [
                    'id'     => $pid,
                    'name'   => $name ?: "ID_{$pid}",
                    'avatar' => $avatar,
                    'level'  => $level
                ];
            }
        }

        // Construir el resultado
        $room = array_merge($infoData, $stateData);
        $room['room_id'] = $roomId;
        $room['players'] = $formattedPlayers;

        return (new RoomResource($room))->resolve();
    }

    public function createRoom(array $data, string $ownerId, string $ownerName): array
    {
        // Usar el ID para comprobar si el jugador ya está en una sala
        $currentRoom = Redis::get("player:{$ownerId}:room");
        if ($currentRoom) {
            throw new \Exception("Ya tienes una partida en curso en la sala {$currentRoom}.", 400);
        }

        $roomId = Str::upper(Str::random(6));
        $gameToken = (string) Str::uuid();

        $infoData = [
            'name' => $data['name'],
            'owner_id' => $ownerId,
            'owner_name' => $ownerName,
            'is_private' => $data['is_private'] ? '1' : '0',
            'password' => $data['is_private'] ? Hash::make($data['password']) : '',
            'max_players' => $data['max_players'],
            'turn_timeout' => $data['turn_timeout'],
            'is_debug'    => ($data['is_debug']) ? '1' : '0',
        ];

        $stateData = [
            'status' => 'waiting',
        ];

        Redis::hmset("room:{$roomId}:info", $infoData);
        Redis::hmset("room:{$roomId}:state", $stateData);
        Redis::sadd("active_rooms", $roomId);

        Redis::setex("player:{$ownerId}:room", 86400, $roomId);
        $playerInfoToSave = [
            'username' => $ownerName,
            'user_id'  => $ownerId,
            'avatar'   => '' // Se rellenará desde la BD en getRoom
        ];

        Redis::hmset("room:{$roomId}:player:{$ownerId}:info", $playerInfoToSave);
        // Expiraciones
        Redis::expire("room:{$roomId}:info", 86400);
        Redis::expire("room:{$roomId}:state", 86400);

        Redis::sadd("room:{$roomId}:players", $ownerId);
        Redis::setex("room:{$roomId}:token:{$gameToken}", 86400, $ownerId);
        Redis::expire("room:{$roomId}:players", 86400);

        event(new RoomListUpdated($roomId));
        event(new RoomStateUpdated($roomId));

        $roomDataResponse = array_merge($infoData, $stateData);
        $roomDataResponse['room_id'] = $roomId;
        $roomDataResponse['players'] = [
            [
                'id' => $ownerId,
                'name' => $ownerName
            ]
        ];
        $roomDataResponse['game_token'] = $gameToken;
        unset($roomDataResponse['password']);

        return $roomDataResponse;
    }

    public function deleteRoom(string $roomId): void
    {
        $roomInfoKey = "room:{$roomId}:info";
        if (!Redis::exists($roomInfoKey)) {
            throw new \Exception("La sala no existe", 404);
        }

        $playerIds = Redis::smembers("room:{$roomId}:players");

        foreach ($playerIds as $playerId) {
            Redis::del("player:{$playerId}:room");
        }

        // Eliminar todas las llaves de la sala usando patrón
        $keys = Redis::keys("room:{$roomId}*");
        if (!empty($keys)) {
            Redis::del($keys);
        }

        // Eliminar de active_rooms
        Redis::srem("active_rooms", $roomId);

        event(new RoomListUpdated($roomId));
    }
}
