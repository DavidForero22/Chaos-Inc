<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redis;
use Symfony\Component\HttpFoundation\Response;

class IsDebugRoom
{
    public function handle(Request $request, Closure $next): Response
    {
        $roomId = $request->route('id')
            ?? $request->route('roomId')
            ?? $request->route('room');

        if (!$roomId) {
            return response()->json(['message' => 'Sala no encontrada.'], 404);
        }

        $isDebug = Redis::hget("room:{$roomId}:info", 'is_debug');

        if ($isDebug !== '1') {
            return response()->json([
                'message' => 'Esta acción solo está disponible en partidas de prueba.',
            ], 403);
        }

        return $next($request);
    }
}
