<?php

namespace App\Http\Controllers;

use App\Services\LiveGameService;
use Illuminate\Http\Request;

class LiveGameController extends Controller
{
    protected $liveGameService;

    public function __construct(LiveGameService $liveGameService)
    {
        $this->liveGameService = $liveGameService;
    }

    public function start(Request $request, $id)
    {
        $playerName = auth('sanctum')->check()
            ? auth('sanctum')->user()->username
            : $request->input('player_name');

        $this->liveGameService->startGame($id, $playerName);

        return response()->json(['message' => 'Game started'], 200);
    }

    public function sync(Request $request, $id)
    {
        $playerName = auth('sanctum')->check()
            ? auth('sanctum')->user()->username
            : $request->input('player_name');

        $data = $this->liveGameService->getPlayerData($id, $playerName);

        return response()->json($data, 200);
    }
}
