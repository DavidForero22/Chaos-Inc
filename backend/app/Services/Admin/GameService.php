<?php

namespace App\Services;

use App\Models\Game;
use Illuminate\Support\Facades\DB;

class GameService
{
    public function getAllGames()
    {
        return Game::with('participants')->get();
    }

    public function getGameById($id)
    {
        return Game::with('participants')->findOrFail($id);
    }

    /**
     * Crea una partida y vincula a los jugadores con sus estadísticas.
     */
    public function createGame(array $validatedData)
    {
        return DB::transaction(function () use ($validatedData) {
            $game = Game::create([
                'winner_role'        => $validatedData['winner_role'],
                'total_rounds'       => $validatedData['total_rounds'],
                'total_eliminations' => $validatedData['total_eliminations'],
            ]);

            foreach ($validatedData['players'] as $player) {
                \App\Models\GameUser::create([
                    'game_id'         => $game->id,
                    'user_id'         => $player['user_id'] ?? null,
                    'is_guest'        => $player['is_guest'],
                    'display_name'    => $player['display_name'],
                    'has_won'         => $player['has_won'],
                    'role'            => $player['role'],
                    'damage_dealt'    => $player['damage_dealt'],
                    'damage_received' => $player['damage_received'],
                    'cards_played'    => $player['cards_played'],
                    'eliminations'    => $player['eliminations'],
                ]);
            }

            return $game;
        });
    }
}
