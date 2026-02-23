<?php

namespace App\Http\Controllers;

use App\Http\Requests\Room\JoinRoomRequest;
use App\Http\Requests\Room\LeaveRoomRequest;
use App\Http\Requests\Room\KickPlayerRequest;
use App\Services\LiveRoomService;
use Illuminate\Support\Str;

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
        $playerName = auth('sanctum')->check()
            ? auth('sanctum')->user()->username
            : $request->input('player_name');

        if (!$playerName) {
            return response()->json(['error' => "The player's name is required to leave the room."], 400);
        }

        $this->liveRoomService->leaveRoom($id, $playerName);

        return response()->json(['message' => 'You have left the room.'], 200);
    }

    public function kick(KickPlayerRequest $request, $id)
    {
        $adminName = auth('sanctum')->check()
            ? auth('sanctum')->user()->username
            : $request->input('admin_name');

        $playerToKick = $request->input('player_to_kick');

        $this->liveRoomService->kickPlayer($id, $adminName, $playerToKick);

        return response()->json(['message' => 'Player kicked successfully.'], 200);
    }
}
