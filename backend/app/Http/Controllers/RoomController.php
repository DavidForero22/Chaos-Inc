<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreRoomRequest;
use App\Services\RoomService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class RoomController extends Controller
{
    protected $roomService;

    public function __construct(RoomService $roomService)
    {
        $this->roomService = $roomService;
    }

    public function index()
    {
        return response()->json($this->roomService->getAllRooms());
    }

    public function store(StoreRoomRequest $request)
    {
        $ownerName = $request->user()->username;
        $roomData = $this->roomService->createRoom($request->validated(), $ownerName);

        return response()->json($roomData, 201);
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
