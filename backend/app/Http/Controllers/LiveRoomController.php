<?php

namespace App\Http\Controllers;

use App\Services\LiveRoomService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class LiveRoomController extends Controller
{
    protected $roomService;

    public function __construct(LiveRoomService $roomService)
    {
        $this->roomService = $roomService;
    }

    public function join(Request $request, $id)
    {
        // Si está logueado, cogemos su usuario real. Si es anónimo, usamos el que mande por POST o generamos uno.
        $playerName = auth('sanctum')->check()
            ? auth('sanctum')->user()->username
            : $request->input('player_name', 'Anon_' . Str::random(4));

        $result = $this->roomService->joinRoom($id, $playerName, $request->input('password'));
        return response()->json($result, 200);
    }

    public function leave(Request $request, $id)
    {
        // Necesitamos saber quién se va. 
        $user = auth('sanctum')->user();
        $playerName = $user ? $user->username : $request->input('player_name');

        if (!$playerName) {
            return response()->json(['error' => "The player's name is required to leave the room."], 400);
        }

        // Ejecutamos la lógica del servicio
        $this->roomService->leaveRoom($id, $playerName);
        return response()->json(['message' => 'You have left the room.']);
    }
}
