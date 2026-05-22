<?php
// app/Services/Admin/GameService.php

namespace App\Services\Admin;

use App\Models\Game;
use App\Models\GameUser;
use Illuminate\Support\Facades\DB;

class GameService
{
    public function getAllGames($perPage = 20, array $filters = [])
    {
        $query = Game::with(['participants', 'cardUsages']);

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
     * Crea una partida y vincula a los jugadores con sus estadísticas y uso de cartas.
     */
    public function createGame(array $validatedData)
    {
        return DB::transaction(function () use ($validatedData) {
            // Crear el registro global de la partida
            $game = Game::create([
                'winner_role'        => $validatedData['winner_role'],
                'total_rounds'       => $validatedData['total_rounds'],
                'total_eliminations' => $validatedData['total_eliminations'],
            ]);

            // Insertar los expedientes de cada jugador
            foreach ($validatedData['players'] as $player) {
                \App\Models\GameUser::create([
                    'game_id'         => $game->id,
                    'user_id'         => $player['user_id'] ?? null,
                    'is_guest'        => $player['is_guest'],
                    'display_name'    => $player['display_name'],
                    'has_won'         => $player['has_won'],
                    'role'            => $player['role'],
                    'is_dead'         => $player['is_dead'] ?? false,
                    'damage_dealt'    => $player['damage_dealt'],
                    'damage_received' => $player['damage_received'],
                    'healing_done'    => $player['healing_done'] ?? 0,
                    'cards_played'    => $player['cards_played'],
                    'passives_played' => $player['passives_played'] ?? 0,
                    'eliminations'    => $player['eliminations'],
                ]);

                // Auditoría de Herramientas (Solo para empleados registrados)
                if (!empty($player['card_details']) && is_array($player['card_details']) && $player['user_id'] !== null) {
                    $cardUsages = [];
                    foreach ($player['card_details'] as $cardKey => $timesPlayed) {
                        // Limpiar el prefijo "card_" que viene de Redis para dejar solo el ID numérico
                        $cleanCardId = str_replace('card_', '', $cardKey);

                        $cardUsages[] = [
                            'game_id'      => $game->id,
                            'user_id'      => $player['user_id'],
                            'card_id'      => $cleanCardId,
                            'times_played' => (int) $timesPlayed,
                            'created_at'   => now(),
                            'updated_at'   => now(),
                        ];
                    }

                    if (!empty($cardUsages)) {
                        DB::table('game_card_usage')->insert($cardUsages);
                    }
                }
            }

            return $game;
        });
    }

    public function createCanceledGame(array $playersData, int $roundNumber): Game
    {
        return DB::transaction(function () use ($playersData, $roundNumber) {
            $game = Game::create([
                'winner_role'        => 'canceled',
                'total_rounds'       => $roundNumber,
                'total_eliminations' => 0,
            ]);

            foreach ($playersData as $player) {
                GameUser::create([
                    'game_id'         => $game->id,
                    'user_id'         => $player['user_id'] ?? null,
                    'is_guest'        => $player['is_guest'],
                    'display_name'    => $player['display_name'],
                    'has_won'         => false,
                    'role'            => $player['role'],
                    'is_dead'         => $player['is_dead'] ?? false,
                    'damage_dealt'    => 0,
                    'damage_received' => 0,
                    'healing_done'    => 0,
                    'cards_played'    => 0,
                    'passives_played' => 0,
                    'eliminations'    => 0,
                    'dodged_attacks'  => 0,
                    'cards_stolen'    => 0,
                ]);
                // No se guarda card_details
            }

            return $game;
        });
    }
}
