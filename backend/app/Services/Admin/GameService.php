<?php
// app/Services/Admin/GameService.php

namespace App\Services\Admin;

use App\Models\Game;
use Illuminate\Support\Facades\DB;

class GameService
{
    public function getAllGames($perPage = 20, array $filters = [])
    {
        $query = Game::with('participants');

        // Filtro: Ganador
        if (!empty($filters['winner']) && $filters['winner'] !== 'all') {
            $query->where('winner_role', $filters['winner']);
        }

        // Filtro: Cantidad de jugadores
        if (!empty($filters['players']) && $filters['players'] !== 'all') {
            $count = (int) $filters['players'];
            $query->has('participants', '=', $count);
        }

        // Ordenación por fecha
        $sortDir = (!empty($filters['sort']) && $filters['sort'] === 'asc') ? 'asc' : 'desc';
        $query->orderBy('created_at', $sortDir);

        return $query->paginate($perPage);
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
