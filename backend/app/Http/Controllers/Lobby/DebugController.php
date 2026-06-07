<?php

namespace App\Http\Controllers\Lobby;

use App\Http\Controllers\Controller;
use App\Http\Requests\Game\DebugRequest;
use App\Http\Resources\GameDataResource;
use App\Services\Game\DebugService;
use Illuminate\Http\JsonResponse;

class DebugController extends Controller
{
    public function __construct(private readonly DebugService $debugService) {}

    public function handle(DebugRequest $request, string $id): JsonResponse
    {
        try {
            $applied = $this->debugService->processDebugAction($id, $request->validated());
        } catch (\Exception $e) {
            $code = $e->getCode();
            $status = (is_numeric($code) && $code >= 400 && $code < 600)
                ? (int) $code
                : 422;

            return response()->json(['message' => $e->getMessage()], $status);
        }

        $gameState = (new GameDataResource([
            'roomId'     => $id,
            'myPlayerId' => (string) $request->input('player_id'),
        ]))->toArray($request);

        return response()->json([
            'applied'    => $applied,
            'game_state' => $gameState,
        ]);
    }
}
