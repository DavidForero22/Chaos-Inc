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

    private function getPlayerId(Request $request, $id): ?string
    {
        $gameToken = $request->header('X-Game-Token') ?? $request->input('game_token');
        return Redis::get("room:{$id}:token:{$gameToken}");
    }

    private function syncResponse($id, $playerId)
    {
        $data = $this->liveGameService->getPlayerData($id, $playerId);
        return response()->json($data, 200);
    }

    // ENDPOINTS

    public function start(Request $request, $id)
    {
        // Obtener el ID del token o del usuario autenticado
        $gameToken = $request->header('X-Game-Token')
            ?? $request->input('game_token')
            ?? $request->query('game_token');

        $playerId = $gameToken
            ? Redis::get("room:{$id}:token:{$gameToken}")
            : (string) $request->user()?->id;

        if (!$playerId) {
            return response()->json(['error' => 'Token no autorizado o caducado.'], 401);
        }

        $this->liveGameService->startGame($id, $playerId);

        // Asumo que syncResponse también requerirá el ID ahora
        return $this->syncResponse($id, $playerId);
    }

    public function sync(Request $request, $id)
    {
        $playerId = $this->getPlayerId($request, $id);
        if (!$playerId) return response()->json(['error' => 'Token no autorizado o caducado.'], 401);

        return $this->syncResponse($id, $playerId);
    }

    public function action(PlayActionRequest $request, $id)
    {
        $playerId = $this->getPlayerId($request, $id);
        if (!$playerId) return response()->json(['error' => 'Token no autorizado o caducado.'], 401);

        $this->gameActionService->playAction(
            $id,
            $playerId,
            $request->input('card_id'),
            $request->input('target_id'),
            $request->input('perk_key'),
             $request->input('sacrifice_card_id')
        );

        return $this->syncResponse($id, $playerId);
    }

    public function endTurn(Request $request, $id)
    {
        $playerId = $this->getPlayerId($request, $id);
        if (!$playerId) return response()->json(['error' => 'Token no autorizado o caducado.'], 401);

        $this->turnService->endTurn($id, $playerId);

        return $this->syncResponse($id, $playerId);
    }

    public function react(Request $request, $id)
    {
        $playerId = $this->getPlayerId($request, $id);
        if (!$playerId) return response()->json(['error' => 'Token no autorizado o caducado.'], 401);

        $this->gameReactionService->reactToAttack(
            $id,
            $playerId,
            $request->input('reaction'),
            $request->input('card_id')
        );

        return $this->syncResponse($id, $playerId);
    }

    public function resolveLuckChallenge(Request $request, $id)
    {
        $playerId = $this->getPlayerId($request, $id);
        if (!$playerId) return response()->json(['error' => 'Token no autorizado o caducado.'], 401);

        try {
            $success = $this->gameReactionService->resolveLuckChallenge($id, $playerId, $request->input('color'));

            // Obtener los datos sincronizados
            $data = $this->liveGameService->getPlayerData($id, $playerId);

            // Inyectar el resultado del challenge en la respuesta
            $data['_luck_result'] = $success ? 'success' : 'fail';

            return response()->json($data, 200);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    public function reactMulti(Request $request, $id)
    {
        $playerId = $this->getPlayerId($request, $id);
        if (!$playerId) return response()->json(['error' => 'Token no autorizado o caducado.'], 401);

        $this->gameReactionService->reactToMultiAttack(
            $id,
            $playerId,
            $request->input('reaction'),
            $request->input('card_id')
        );

        return $this->syncResponse($id, $playerId);
    }

    public function discard(Request $request, $id)
    {
        $playerId = $this->getPlayerId($request, $id);
        if (!$playerId) return response()->json(['error' => 'Token no autorizado o caducado.'], 401);

        $request->validate(['card_ids' => 'required|array', 'card_ids.*' => 'string']);

        $this->playerHandService->discardCards($id, $playerId, $request->input('card_ids'));

        return $this->syncResponse($id, $playerId);
    }

    public function reactDiscard(Request $request, $id)
    {
        $playerId = $this->getPlayerId($request, $id);
        if (!$playerId) return response()->json(['error' => 'Token no autorizado o caducado.'], 401);

        $request->validate(['card_id' => 'required|string']);

        $this->gameReactionService->resolveSabotage($id, $playerId, $request->input('card_id'));

        return $this->syncResponse($id, $playerId);
    }

    public function discardPerks(Request $request, $id)
    {
        $playerId = $this->getPlayerId($request, $id);
        if (!$playerId) return response()->json(['error' => 'Token no autorizado o caducado.'], 401);

        $request->validate(['perk_ids' => 'required|array', 'perk_ids.*' => 'string']);

        $this->playerHandService->discardPerks($id, $playerId, $request->input('perk_ids'));

        return $this->syncResponse($id, $playerId);
    }
}
