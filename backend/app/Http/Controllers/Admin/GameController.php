<?php

namespace App\Http\Controllers;

use App\Services\GameService;
use App\Http\Requests\Game\StoreGameRequest;
use App\Http\Resources\GameResource;
use App\Models\Game;
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
        $game = $this->gameService->createGame($validated);

        return new GameResource($game);
    }

    public function show($id)
    {
        $game = $this->gameService->getGameById($id);
        return new GameResource($game);
    }

    public function myGames(Request $request)
    {
        $user = $request->user();
        $games = $user->games()->with('participants')->latest()->get();
        return GameResource::collection($games);
    }
}
