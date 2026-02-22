<?php

namespace App\Http\Controllers;

use App\Services\LiveGameService;
use Exception;
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

        try {
            $this->liveGameService->startGame($id, $playerName);
            return response()->json(['message' => 'Partida iniciada'], 200);
        } catch (Exception $e) {
            $status = $e->getCode() ?: 400;
            return response()->json(['error' => $e->getMessage()], $status === 0 ? 400 : $status);
        }
    }

    public function sync(Request $request, $id)
    {
        $playerName = auth('sanctum')->check()
            ? auth('sanctum')->user()->username
            : $request->input('player_name');

        try {
            // Este método devolverá la info privada del jugador
            $data = $this->liveGameService->getPlayerData($id, $playerName);
            return response()->json($data, 200);
        } catch (Exception $e) {
            $status = $e->getCode() ?: 400;
            return response()->json(['error' => $e->getMessage()], $status === 0 ? 400 : $status);
        }
    }
}
