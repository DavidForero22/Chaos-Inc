<?php
// app/Http/Controllers/Lobby/LiveGameController.php

namespace App\Http\Controllers\Lobby;

use App\Http\Controllers\Controller;
use App\Http\Requests\Game\PlayActionRequest;
use App\Services\Game\Actions\GameActionService;
use App\Services\Game\Actions\GameReactionService;
use App\Services\Game\Engine\PlayerHandService;
use App\Services\Game\Engine\TurnService;
use App\Services\Game\LiveGameService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redis;

class LiveGameController extends Controller
{
    protected $liveGameService;
    protected $gameActionService;
    protected $gameReactionService;
    protected $turnService;
    protected $playerHandService;

    public function __construct(LiveGameService $liveGameService, GameActionService $gameActionService, GameReactionService $gameReactionService,TurnService $turnService, PlayerHandService $playerHandService)
    {
        $this->liveGameService = $liveGameService;
        $this->gameActionService = $gameActionService;
        $this->gameReactionService = $gameReactionService;
        $this->turnService = $turnService;
        $this->playerHandService = $playerHandService;
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

        $this->gameActionService->playAction(
            $id,
            $playerName,
            $request->input('card_id'),
            $request->input('target_name'),
            $request->input('perk_key')
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

        $this->turnService->endTurn($id, $playerName);

        return response()->json(['message' => 'Turn ended'], 200);
    }

    public function react(Request $request, $id)
    {
        $gameToken = $request->header('X-Game-Token') ?? $request->input('game_token');
        $playerName = Redis::get("room:{$id}:token:{$gameToken}");

        if (!$playerName) {
            return response()->json(['error' => 'Unauthorized or expired token.'], 401);
        }

        $reaction = $request->input('reaction');
        $cardId = $request->input('card_id');

        $this->gameReactionService->reactToAttack($id, $playerName, $reaction, $cardId);

        return response()->json(['message' => 'Reaction processed'], 200);
    }

    public function resolveLuckChallenge(Request $request, $id)
    {
        $gameToken = $request->header('X-Game-Token');
        $playerName = Redis::get("room:{$id}:token:{$gameToken}");

        if (!$playerName) {
            return response()->json(['error' => 'Unauthorized.'], 401);
        }

        $chosen = $request->input('color');

        try {
            $success = $this->gameReactionService->resolveLuckChallenge($id, $playerName, $chosen);

            return response()->json(['result' => $success ? 'success' : 'fail']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    public function reactMulti(Request $request, $id)
    {
        $gameToken  = $request->header('X-Game-Token') ?? $request->input('game_token');
        $playerName = Redis::get("room:{$id}:token:{$gameToken}");

        if (!$playerName) {
            return response()->json(['error' => 'Unauthorized or expired token.'], 401);
        }

        $reaction = $request->input('reaction');
        $cardId   = $request->input('card_id');

        $this->gameReactionService->reactToMultiAttack($id, $playerName, $reaction, $cardId);

        return response()->json(['message' => 'Reaction processed.'], 200);
    }

    public function discard(Request $request, $id)
    {
        $gameToken = $request->header('X-Game-Token') ?? $request->input('game_token');
        $playerName = Redis::get("room:{$id}:token:{$gameToken}");

        if (!$playerName) {
            return response()->json(['error' => 'Unauthorized or expired token.'], 401);
        }

        $request->validate([
            'card_ids'   => 'required|array',
            'card_ids.*' => 'string'
        ]);

        $this->playerHandService->discardCards($id, $playerName, $request->input('card_ids'));

        return response()->json(['message' => 'Cards discarded successfully'], 200);
    }

    public function reactDiscard(Request $request, $id)
    {
        $gameToken = $request->header('X-Game-Token') ?? $request->input('game_token');
        $playerName = Redis::get("room:{$id}:token:{$gameToken}");

        if (!$playerName) {
            return response()->json(['error' => 'Unauthorized or expired token.'], 401);
        }

        $request->validate([
            'card_id' => 'required|string'
        ]);

        $this->gameReactionService->resolveSabotage($id, $playerName, $request->input('card_id'));

        return response()->json(['message' => 'Discard reaction processed'], 200);
    }

    public function discardPerks(Request $request, $id)
    {
        $gameToken = $request->header('X-Game-Token') ?? $request->input('game_token');
        $playerName = Redis::get("room:{$id}:token:{$gameToken}");

        if (!$playerName) {
            return response()->json(['error' => 'Unauthorized or expired token.'], 401);
        }

        $request->validate([
            'perk_ids'   => 'required|array',
            'perk_ids.*' => 'string'
        ]);

        $this->playerHandService->discardPerks($id, $playerName, $request->input('perk_ids'));

        return response()->json(['message' => 'Perks discarded successfully'], 200);
    }
}
