<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GameResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'winnerRole' => $this->winner_role, 
            'totalRounds' => $this->total_rounds,
            'totalEliminations' => $this->total_eliminations,
            'playedAt' => $this->created_at->toIso8601String(),

            // Tabla pivot
            'players' => $this->whenLoaded('users', function () {
                return $this->users->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'username' => $user->username,
                        'stats' => [
                            // Asegurar que el booleano llegue como true/false y no como 1/0
                            'hasWon' => (bool) $user->pivot->has_won,
                            'role' => $user->pivot->role,
                            'damageDealt' => $user->pivot->damage_dealt,
                            'damageReceived' => $user->pivot->damage_received,
                            'cardsPlayed' => $user->pivot->cards_played,
                            'eliminations' => $user->pivot->eliminations,
                        ]
                    ];
                });
            }),
        ];
    }
}
