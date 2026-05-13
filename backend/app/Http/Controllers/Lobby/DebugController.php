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
            $status = ($e->getCode() >= 400 && $e->getCode() < 600)
                ? $e->getCode()
                : 422;

            return response()->json(['message' => $e->getMessage()], $status);
        }

        $gameState = (new GameDataResource(['roomId' => $id]))->toArray($request);

        return response()->json([
            'applied'    => $applied,
            'game_state' => $gameState,
        ]);
    }
}
