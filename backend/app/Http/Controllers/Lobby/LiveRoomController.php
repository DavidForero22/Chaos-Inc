<?php
// app/Http/Controllers/Lobby/LiveRoomController.php

namespace App\Http\Controllers\Lobby;

use App\Http\Controllers\Controller;
use App\Http\Requests\Room\JoinRoomRequest;
use App\Http\Requests\Room\KickPlayerRequest;
use App\Services\Lobby\LiveRoomService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redis;

class LiveRoomController extends Controller
{
    protected $liveRoomService;

    public function __construct(LiveRoomService $liveRoomService)
    {
        $this->liveRoomService = $liveRoomService;
    }

    public function join(JoinRoomRequest $request, $id)
    {
        $user = $request->user();
        $playerName = $user->username;

        $result = $this->liveRoomService->joinRoom($id, $playerName, $request->input('password'));

        return response()->json($result, 200);
    }

    public function leave(Request $request, $id)
    {
        $user = $request->user();
        $gameToken = $request->header('X-Game-Token') ?? $request->input('game_token');

        // Validar el Token de Partida contra el Token de Identidad (Sanctum)
        $playerNameFromRedis = Redis::get("room:{$id}:token:{$gameToken}");

        if (!$playerNameFromRedis || $playerNameFromRedis !== $user->username) {
            return response()->json(['error' => 'Invalid identity or session expired.'], 403);
        }

        $this->liveRoomService->leaveRoom($id, $user->username);

        // Limpieza de token de Redis
        $roomStatus = Redis::hget("room:{$id}", "status");
        if ($roomStatus !== 'in_game') {
            Redis::del("room:{$id}:token:{$gameToken}");
        }

        return response()->json(['message' => 'Action processed successfully.'], 200);
    }

    public function kick(KickPlayerRequest $request, $id)
    {
        $user = $request->user();
        $gameToken = $request->header('X-Game-Token') ?? $request->input('game_token');

        // Validar que el que intenta echar sea quien dice ser
        $adminNameFromRedis = Redis::get("room:{$id}:token:{$gameToken}");

        if (!$adminNameFromRedis || $adminNameFromRedis !== $user->username) {
            return response()->json(['error' => 'Unauthorized action.'], 403);
        }

        $playerToKick = $request->input('player_to_kick');

        // El servicio se encarga de verificar si $user->username es el líder de la sala
        $this->liveRoomService->kickPlayer($id, $user->username, $playerToKick);

        return response()->json(['message' => 'Player kicked successfully.'], 200);
    }
}
