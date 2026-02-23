<?php

namespace App\Http\Controllers;

use App\Http\Requests\Game\StartGameRequest;
use App\Http\Requests\Game\SyncGameRequest;
use App\Services\LiveGameService;

class LiveGameController extends Controller
{
    protected $liveGameService;

    public function __construct(LiveGameService $liveGameService)
    {
        $this->liveGameService = $liveGameService;
    }

    public function start(StartGameRequest $request, $id)
    {
        $playerName = auth('sanctum')->check()
            ? auth('sanctum')->user()->username
            : $request->input('player_name');

        $this->liveGameService->startGame($id, $playerName);

        return response()->json(['message' => 'Game started'], 200);
    }

    public function sync(SyncGameRequest $request, $id)
    {
        $playerName = auth('sanctum')->check()
            ? auth('sanctum')->user()->username
            : $request->input('player_name');

        $data = $this->liveGameService->getPlayerData($id, $playerName);

        return response()->json($data, 200);
    }
}
