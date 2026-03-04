<?php

namespace App\Http\Controllers;

use App\Http\Requests\Game\PlayActionRequest;
use App\Http\Requests\Game\StartGameRequest;
use App\Http\Requests\Game\SyncGameRequest;
use App\Services\LiveGameService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redis;

class LiveGameController extends Controller
{
    protected $liveGameService;

    public function __construct(LiveGameService $liveGameService)
    {
        $this->liveGameService = $liveGameService;
    }

    public function start(StartGameRequest $request, $id)
    {
        $gameToken = $request->header('X-Game-Token') ?? $request->input('game_token');
        $playerName = Redis::get("room:{$id}:token:{$gameToken}");

        if (!$playerName) {
            return response()->json(['error' => 'Unauthorized or expired token.'], 401);
        }

        $this->liveGameService->startGame($id, $playerName);

        return response()->json(['message' => 'Game started'], 200);
    }

    public function sync(SyncGameRequest $request, $id)
    {
        $gameToken = $request->header('X-Game-Token') ?? $request->input('game_token');
        $playerName = Redis::get("room:{$id}:token:{$gameToken}");

        if (!$playerName) {
            return response()->json(['error' => 'Unauthorized or expired token.'], 401);
        }

        $data = $this->liveGameService->getPlayerData($id, $playerName);

        return response()->json($data, 200);
    }

    public function action(PlayActionRequest $request, $id)
    {
        $gameToken = $request->header('X-Game-Token') ?? $request->input('game_token');
        $playerName = Redis::get("room:{$id}:token:{$gameToken}");

        if (!$playerName) {
            return response()->json(['error' => 'Unauthorized or expired token.'], 401);
        }

        // Llamamos al servicio con los datos validados
        $this->liveGameService->playAction(
            $id,
            $playerName,
            $request->input('card_id'),
            $request->input('target_name')
        );

        return response()->json(['message' => 'Action executed successfully'], 200);
    }

    public function endTurn(Request $request, $id)
    {
        $gameToken = $request->header('X-Game-Token') ?? $request->input('game_token');
        $playerName = Redis::get("room:{$id}:token:{$gameToken}");

        if (!$playerName) {
            return response()->json(['error' => 'Unauthorized or expired token.'], 401);
        }

        $this->liveGameService->endTurn($id, $playerName);

        return response()->json(['message' => 'Turn ended'], 200);
    }
}
