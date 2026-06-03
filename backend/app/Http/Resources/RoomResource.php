<?php
// app/Http/Resources/RoomResource.php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Support\CastHelper;

class RoomResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $room = $this->resource;

        return [
            'room_id'     => $room['room_id'],
            'name'        => $room['name'] ?? 'Sala sin nombre',
            'max_players' => (int) ($room['max_players'] ?? 6),
            'turn_timeout' => (int) ($room['turn_timeout'] ?? 80),
            'owner_id'    => (string) ($room['owner_id'] ?? ''),
            'owner_name'  => $room['owner_name'] ?? 'Desconocido',
            'status'      => $room['status'] ?? 'waiting',

            'is_private'  => CastHelper::toBool($room['is_private'] ?? 0),
            'is_debug'    => CastHelper::toBool($room['is_debug'] ?? 0),

            // Los jugadores vienen formateados del servicio
            'players'     => array_map(function ($player) {
                return [
                    'id'     => (string) $player['id'],
                    'name'   => $player['name'],
                    'avatar' => $player['avatar'] ?? null,
                    'level'  => (int) ($player['level'] ?? 1),
                ];
            }, $room['players'] ?? []),
        ];
    }
}
