<?php

namespace App\Http\Controllers;

use App\Services\GameService;
use App\Http\Requests\StoreGameRequest;
use App\Http\Resources\GameResource;
use Illuminate\Http\Request;

class GameController extends Controller
{
    protected $gameService;

    public function __construct(GameService $gameService)
    {
        $this->gameService = $gameService;
    }

    public function index()
    {
        $games = $this->gameService->getAllGames();
        return GameResource::collection($games);
    }

    public function store(StoreGameRequest $request)
    {
        $validated = $request->validated();

        // Preparar datos de la cabecera
        $gameData = [
            'winner_role' => $validated['winner_role'],
            'total_rounds' => $validated['total_rounds'],
            'total_eliminations' => $validated['total_eliminations'],
        ];

        // Formatear los jugadores para el método attach() (tabla game_user)
        // Se convierte el array normal a un array asociativo usando el user_id como clave
        $playersData = [];
        foreach ($validated['players'] as $player) {
            $playersData[$player['user_id']] = [
                'has_won' => $player['has_won'],
                'role' => $player['role'],
                'damage_dealt' => $player['damage_dealt'],
                'damage_received' => $player['damage_received'],
                'cards_played' => $player['cards_played'],
                'eliminations' => $player['eliminations'],
            ];
        }

        // Enviar todo al Servicio para que lo guarde en una Transacción segura
        $game = $this->gameService->createGame($gameData, $playersData);

        return new GameResource($game);
    }

    public function show($id)
    {
        $game = $this->gameService->getGameById($id);
        return new GameResource($game);
    }

    public function update(Request $request, $id)
    {
        $game = $this->gameService->updateGame($id, $request->all());
        return new GameResource($game);
    }

    public function destroy($id)
    {
        $this->gameService->deleteGame($id);
        return response()->noContent();
    }
}
