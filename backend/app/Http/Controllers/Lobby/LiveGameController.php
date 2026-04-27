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

    public function __construct(
        LiveGameService $liveGameService,
        GameActionService $gameActionService,
        GameReactionService $gameReactionService,
        TurnService $turnService,
        PlayerHandService $playerHandService
    ) {
        $this->liveGameService = $liveGameService;
        $this->gameActionService = $gameActionService;
        $this->gameReactionService = $gameReactionService;
        $this->turnService = $turnService;
        $this->playerHandService = $playerHandService;
    }

    // MÉTODOS PRIVADOS DE AYUDA 

    private function getPlayerName(Request $request, $id): ?string
    {
        $gameToken = $request->header('X-Game-Token') ?? $request->input('game_token');
        return Redis::get("room:{$id}:token:{$gameToken}");
    }

    private function syncResponse($id, $playerName)
    {
        $data = $this->liveGameService->getPlayerData($id, $playerName);
        return response()->json($data, 200);
    }

    // ENDPOINTS

    public function start(Request $request, $id)
    {
        $playerName = $this->getPlayerName($request, $id);
        if (!$playerName) return response()->json(['error' => 'Token no autorizado o caducado.'], 401);

        $this->liveGameService->startGame($id, $playerName);

        return $this->syncResponse($id, $playerName);
    }

    public function sync(Request $request, $id)
    {
        $playerName = $this->getPlayerName($request, $id);
        if (!$playerName) return response()->json(['error' => 'Token no autorizado o caducado.'], 401);

        return $this->syncResponse($id, $playerName);
    }

    public function action(PlayActionRequest $request, $id)
    {
        $playerName = $this->getPlayerName($request, $id);
        if (!$playerName) return response()->json(['error' => 'Token no autorizado o caducado.'], 401);

        $this->gameActionService->playAction(
            $id,
            $playerName,
            $request->input('card_id'),
            $request->input('target_name'),
            $request->input('perk_key')
        );

        return $this->syncResponse($id, $playerName);
    }

    public function endTurn(Request $request, $id)
    {
        $playerName = $this->getPlayerName($request, $id);
        if (!$playerName) return response()->json(['error' => 'Token no autorizado o caducado.'], 401);

        $this->turnService->endTurn($id, $playerName);

        return $this->syncResponse($id, $playerName);
    }

    public function react(Request $request, $id)
    {
        $playerName = $this->getPlayerName($request, $id);
        if (!$playerName) return response()->json(['error' => 'Token no autorizado o caducado.'], 401);

        $this->gameReactionService->reactToAttack(
            $id,
            $playerName,
            $request->input('reaction'),
            $request->input('card_id')
        );

        return $this->syncResponse($id, $playerName);
    }

    public function resolveLuckChallenge(Request $request, $id)
    {
        $playerName = $this->getPlayerName($request, $id);
        if (!$playerName) return response()->json(['error' => 'Token no autorizado o caducado.'], 401);

        try {
            $success = $this->gameReactionService->resolveLuckChallenge($id, $playerName, $request->input('color'));

            // Obtener los datos sincronizados
            $data = $this->liveGameService->getPlayerData($id, $playerName);

            // Inyectar el resultado del challenge en la respuesta para que el frontend no pierda esa info
            $data['_luck_result'] = $success ? 'success' : 'fail';

            return response()->json($data, 200);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    public function reactMulti(Request $request, $id)
    {
        $playerName = $this->getPlayerName($request, $id);
        if (!$playerName) return response()->json(['error' => 'Token no autorizado o caducado.'], 401);

        $this->gameReactionService->reactToMultiAttack(
            $id,
            $playerName,
            $request->input('reaction'),
            $request->input('card_id')
        );

        return $this->syncResponse($id, $playerName);
    }

    public function discard(Request $request, $id)
    {
        $playerName = $this->getPlayerName($request, $id);
        if (!$playerName) return response()->json(['error' => 'Token no autorizado o caducado.'], 401);

        $request->validate(['card_ids' => 'required|array', 'card_ids.*' => 'string']);

        $this->playerHandService->discardCards($id, $playerName, $request->input('card_ids'));

        return $this->syncResponse($id, $playerName);
    }

    public function reactDiscard(Request $request, $id)
    {
        $playerName = $this->getPlayerName($request, $id);
        if (!$playerName) return response()->json(['error' => 'Token no autorizado o caducado.'], 401);

        $request->validate(['card_id' => 'required|string']);

        $this->gameReactionService->resolveSabotage($id, $playerName, $request->input('card_id'));

        return $this->syncResponse($id, $playerName);
    }

    public function discardPerks(Request $request, $id)
    {
        $playerName = $this->getPlayerName($request, $id);
        if (!$playerName) return response()->json(['error' => 'Token no autorizado o caducado.'], 401);

        $request->validate(['perk_ids' => 'required|array', 'perk_ids.*' => 'string']);

        $this->playerHandService->discardPerks($id, $playerName, $request->input('perk_ids'));

        return $this->syncResponse($id, $playerName);
    }
}
