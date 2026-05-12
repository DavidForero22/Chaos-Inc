<?php
// app/Http/Controllers/Admin/GameController.php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Game\StoreGameRequest;
use App\Http\Resources\CardCatalogResource;
use App\Http\Resources\GameResource;
use App\Models\User;
use App\Services\Admin\GameService;
use Illuminate\Http\Request;

class GameController extends Controller
{
    protected $gameService;

    public function __construct(GameService $gameService)
    {
        $this->gameService = $gameService;
    }

    public function index(Request $request)
    {
        $filters = $request->only(['winner', 'players', 'sort']);

        $games = $this->gameService->getAllGames(20, $filters);

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
        $games = $user->games()->with(['participants', 'cardUsages'])->latest()->get();
        return GameResource::collection($games);
    }

    public function userGames(Request $request, User $user)
    {
        $games = $user->games()->with(['participants', 'cardUsages'])->latest()->get();
        return GameResource::collection($games);
    }

    public function getCards()
    {
        $cards = config('cards.cards', []);
        return CardCatalogResource::collection(collect($cards));
    }
}
