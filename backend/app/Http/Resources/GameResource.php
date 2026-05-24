<?php
// app/Http/Resources/GameResource.php

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
            'id'                => $this->id,
            'winnerRole'        => $this->winner_role,
            'totalRounds'       => $this->total_rounds,
            'totalEliminations' => $this->total_eliminations,
            'playedAt'          => $this->created_at->toIso8601String(),

            'players' => $this->whenLoaded('participants', function () {
                return $this->participants->map(function ($participant) {
                    return [
                        'userId'      => $participant->user_id,
                        'displayName' => $participant->display_name,
                        'isGuest'     => (bool) $participant->is_guest,

                        'stats'       => [
                            'hasWon'          => (bool) $participant->has_won,
                            'role'            => $participant->role,
                            'isDead'          => (bool) $participant->is_dead,
                            'damageDealt'     => $participant->damage_dealt,
                            'damageReceived'  => $participant->damage_received,
                            'healingDone'     => $participant->healing_done,
                            'cardsPlayed'     => $participant->cards_played,
                            'passivesPlayed'  => $participant->passives_played,
                            'eliminations'    => $participant->eliminations,
                            'dodgedAttacks'   => $participant->dodged_attacks,
                            'cardsStolen'     => $participant->cards_stolen,
                        ],

                        // Desglose de cartas del jugador
                        'cardUsages' => $this->whenLoaded('cardUsages', function () use ($participant) {
                            return $this->cardUsages
                                ->where('user_id', $participant->user_id)
                                ->map(function ($usage) {
                                    return [
                                        'cardId'      => $usage->card_id,
                                        'name'        => $usage->card_name,
                                        'timesPlayed' => $usage->times_played,
                                    ];
                                })
                                ->values();
                        }),
                    ];
                });
            }),
        ];
    }
}
