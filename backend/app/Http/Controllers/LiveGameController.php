<?php

namespace App\Http\Controllers;

use App\Events\RoomStateUpdated;
use App\Http\Requests\Game\PlayActionRequest;
use App\Services\LiveGame\LiveGameService;
use App\Services\LiveGame\TurnService;
use App\Support\GameMessages;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redis;

class LiveGameController extends Controller
{
    protected $liveGameService;

    public function __construct(LiveGameService $liveGameService)
    {
        $this->liveGameService = $liveGameService;
    }

    public function start(Request $request, $id)
    {
        $gameToken = $request->header('X-Game-Token') ?? $request->input('game_token');
        $playerName = Redis::get("room:{$id}:token:{$gameToken}");

        if (!$playerName) {
            return response()->json(['error' => 'Unauthorized or expired token.'], 401);
        }

        $this->liveGameService->startGame($id, $playerName);

        return response()->json(['message' => 'Game started'], 200);
    }

    public function sync(Request $request, $id)
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

    public function react(Request $request, $id)
    {
        $gameToken = $request->header('X-Game-Token') ?? $request->input('game_token');
        $playerName = Redis::get("room:{$id}:token:{$gameToken}");

        if (!$playerName) {
            return response()->json(['error' => 'Unauthorized or expired token.'], 401);
        }

        $reaction = $request->input('reaction'); // 'dodge' o 'accept'
        $cardId = $request->input('card_id'); // opcional, solo para esquivar

        $this->liveGameService->reactToAttack($id, $playerName, $reaction, $cardId);

        return response()->json(['message' => 'Reaction processed'], 200);
    }

    public function resolveLuckChallenge(Request $request, $id)
    {
        $gameToken = $request->header('X-Game-Token');
        $playerName = Redis::get("room:{$id}:token:{$gameToken}");

        if (!$playerName) {
            return response()->json(['error' => 'Unauthorized.'], 401);
        }

        $challengeKey = "room:{$id}:luck_challenge:{$playerName}";

        if (!Redis::exists($challengeKey)) {
            return response()->json(['error' => 'No hay ningún desafío activo.'], 422);
        }

        $correct = Redis::get($challengeKey);
        $chosen  = $request->input('color');

        Redis::del($challengeKey);

        if ($chosen === $correct) {
            // Acertó — puede jugar su turno normalmente
            event(new RoomStateUpdated($id, GameMessages::luckySuccess($playerName)));
            return response()->json(['result' => 'success']);
        } else {
            // Falló — se salta el turno
            app(TurnService::class)->advanceTurn($id);
            event(new RoomStateUpdated($id, GameMessages::luckyFail($playerName)));
            return response()->json(['result' => 'fail']);
        }
    }
}
