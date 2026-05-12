<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redis;
use Symfony\Component\HttpFoundation\Response;

class IsGhostPlayer
{
    public function handle(Request $request, Closure $next): Response
    {
        $playerId = $request->input('player_id');
        $roomId   = $request->route('id')
            ?? $request->route('roomId')
            ?? $request->route('room');

        if (!$playerId) {
            return response()->json(['message' => 'El campo player_id es requerido.'], 422);
        }

        if (!$roomId) {
            return response()->json(['message' => 'Sala no encontrada.'], 404);
        }

        $info = Redis::hgetall("room:{$roomId}:player:{$playerId}:info");

        if (empty($info) || ($info['is_ghost'] ?? '0') !== '1') {
            return response()->json([
                'message' => 'El jugador especificado no es un jugador fantasma válido.',
            ], 403);
        }

        return $next($request);
    }
}
