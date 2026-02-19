<?php

namespace App\Services;

use App\Models\Game;
use Illuminate\Support\Facades\DB;

class GameService
{
    public function getAllGames()
    {
        return Game::with('users')->get();
    }

    public function getGameById($id)
    {
        return Game::with('users')->findOrFail($id);
    }

    /**
     * Crea una partida y vincula a los jugadores con sus estadísticas.
     * Ideal para llamar al finalizar la partida en Redis.
     */
    public function createGame(array $gameData, array $playersData)
    {
        return DB::transaction(function () use ($gameData, $playersData) {
            // 1. Crear la cabecera de la partida
            $game = Game::create($gameData);

            // 2. Vincular jugadores (Match_User) con los datos del pivot
            // $playersData debe ser un array tipo: [user_id => ['damage_dealt' => 10, ...]]
            $game->users()->attach($playersData);

            return $game->load('users');
        });
    }

    public function updateGame($id, array $data)
    {
        $game = Game::findOrFail($id);
        $game->update($data);
        return $game;
    }

    public function deleteGame($id)
    {
        $game = Game::findOrFail($id);
        return $game->delete();
    }
}
