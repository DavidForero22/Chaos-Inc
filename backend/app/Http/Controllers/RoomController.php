<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreRoomRequest;
use App\Services\RoomService;
use Exception;
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

        try {
            $result = $this->roomService->joinRoom($id, $playerName, $request->input('password'));
            return response()->json($result, 200);
        } catch (Exception $e) {
            $status = $e->getCode() ?: 400;
            // Laravel a veces considera 0 como código por defecto en Exceptions, forzamos 400
            return response()->json(['error' => $e->getMessage()], $status === 0 ? 400 : $status);
        }
    }

    public function leave(Request $request, $id)
    {
        // Necesitamos saber quién se va. 
        $playerName = auth('sanctum')->check()
            ? auth('sanctum')->user()->username
            : $request->input('player_name');

        if (!$playerName) {
            return response()->json(['error' => 'Se requiere el nombre del jugador para abandonar la sala.'], 400);
        }

        $this->roomService->leaveRoom($id, $playerName);

        return response()->json(['message' => 'Has abandonado la sala.'], 200);
    }
}
