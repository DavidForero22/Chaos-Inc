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
     */
    public function createGame(array $validatedData)
    {
        return DB::transaction(function () use ($validatedData) {
            // Crear la cabecera de la partida
            $game = Game::create([
                'winner_role' => $validatedData['winner_role'],
                'total_rounds' => $validatedData['total_rounds'],
                'total_eliminations' => $validatedData['total_eliminations'],
            ]);

            // Transformar los datos para el pivot
            $playersData = [];
            foreach ($validatedData['players'] as $player) {
                $playersData[$player['user_id']] = [
                    'has_won' => $player['has_won'],
                    'role' => $player['role'],
                    'damage_dealt' => $player['damage_dealt'],
                    'damage_received' => $player['damage_received'],
                    'cards_played' => $player['cards_played'],
                    'eliminations' => $player['eliminations'],
                ];
            }

            $game->users()->attach($playersData);

            return $game;
        });
    }
}
