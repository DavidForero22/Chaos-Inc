<?php

namespace App\Http\Controllers;

use App\Http\Requests\Room\JoinRoomRequest;
use App\Http\Requests\Room\LeaveRoomRequest;
use App\Http\Requests\Room\KickPlayerRequest;
use App\Services\LiveRoomService;
use Illuminate\Support\Str;
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
        $playerName = auth('sanctum')->check()
            ? auth('sanctum')->user()->username
            : $request->input('player_name', 'Anon_' . Str::random(4));

        $result = $this->liveRoomService->joinRoom($id, $playerName, $request->input('password'));

        return response()->json($result, 200);
    }

    public function leave(LeaveRoomRequest $request, $id)
    {
        // OBTENER TOKEN Y VALIDAR IDENTIDAD
        $gameToken = $request->header('X-Game-Token') ?? $request->input('game_token');
        $playerName = Redis::get("room:{$id}:token:{$gameToken}");

        if (!$playerName) {
            return response()->json(['error' => 'Unauthorized or expired token.'], 401);
        }

        $this->liveRoomService->leaveRoom($id, $playerName);

        // Borar el token si la partida NO ha empezado.
        $roomStatus = Redis::hget("room:{$id}", "status");

        if ($roomStatus !== 'in_game') {
            Redis::del("room:{$id}:token:{$gameToken}");
        }

        return response()->json(['message' => 'Action processed successfully.'], 200);
    }

    public function kick(KickPlayerRequest $request, $id)
    {
        // OBTENER TOKEN DEL QUE EJECUTA LA ACCIÓN
        $gameToken = $request->header('X-Game-Token') ?? $request->input('game_token');
        $adminName = Redis::get("room:{$id}:token:{$gameToken}");

        if (!$adminName) {
            return response()->json(['error' => 'Unauthorized or expired token.'], 401);
        }

        $playerToKick = $request->input('player_to_kick');

        // El servicio validará si el $adminName es realmente el dueño de la sala
        $this->liveRoomService->kickPlayer($id, $adminName, $playerToKick);

        return response()->json(['message' => 'Player kicked successfully.'], 200);
    }
}
