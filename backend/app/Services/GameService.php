<?php

namespace App\Services;

use App\Models\Game;
use Illuminate\Support\Facades\DB;

class GameService
{
    public function getAllGames()
    {
        return Game::with(['users' => function ($query) {
            $query->withTrashed();
        }])->get();
    }

    public function getGameById($id)
    {
        return Game::with(['users' => function ($query) {
            $query->withTrashed();
        }])->findOrFail($id);
    }

    /**
     * Crea una partida y vincula a los jugadores con sus estadísticas.
     * Ideal para llamar al finalizar la partida en Redis.
     */
    public function createGame(array $gameData, array $playersData)
    {
        return DB::transaction(function () use ($gameData, $playersData) {
            // Crear la cabecera de la partida
            $game = Game::create($gameData);

            // Vincular jugadores (Match_User) con los datos del pivot
            $game->users()->attach($playersData);

            return $game->load('users');
        });
    }
}
