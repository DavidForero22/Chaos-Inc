<?php
// app/Http/Resources/MyDataResource.php

namespace App\Http\Resources;

use App\Services\Game\Engine\CombatService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Redis;
use App\Support\CastHelper;

class MyDataResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $playerId    = $this['playerId'];
        $playerName    = $this['playerName'];
        $myData        = $this['myData'];
        $pendingAttack = $this['pendingAttack'];
        $roomId        = $this['roomId'];

        $hasIncomingAttack = !empty($pendingAttack) && ($pendingAttack['target'] ?? null) === $playerId;
        $hasPendingAttack  = !empty($pendingAttack) && ($pendingAttack['attacker'] ?? null) === $playerId;

        $pendingMultiAttack = $this['pendingMultiAttack'] ?? null;
        $hasPendingMultiAttack = !empty($pendingMultiAttack)
            && in_array($playerId, $pendingMultiAttack['targets'] ?? []);

        $hasPendingMultiAsAttacker = !empty($pendingMultiAttack)
            && ($pendingMultiAttack['attacker'] ?? null) === $playerId
            && !empty($pendingMultiAttack['targets'] ?? []);

        // Luck challenge ahora por ID
        $challengeKey = "room:{$roomId}:luck_challenge:{$playerId}";
        $hasChallenge = Redis::exists($challengeKey);

        $challengeColors = null;
        if ($hasChallenge) {
            $colors = ['red', 'blue', 'green', 'yellow'];
            shuffle($colors);
            $challengeColors = $colors;
        }

        // CÁLCULO DEL LÍMITE DE CARTAS EN MANO
        $currentStress = (int) $myData['stress'];
        $isBossOrActing = $myData['role'] === 'boss' || CastHelper::toBool($myData['acting_boss'] ?? 0);
        $maxStress = $isBossOrActing ? 5 : 4;

        $storageBonus = CastHelper::toBool($myData['has_storage'] ?? 0) ? 1 : 0;

        $maxHandSize = max(1, ($maxStress + 1) - $currentStress) + $storageBonus;

        return [
            // Identidad
            'id'                       => $playerId,
            'name'                     => $playerName,
            'role'                     => $myData['role'],
            'stress'                   => $currentStress,
            'max_stress'               => $maxStress,
            'is_dead'                  => CastHelper::toBool($myData['is_dead'] ?? 0),
            'killer_name'              => $myData['killer_name'] ?? null,
            'is_online'                => CastHelper::toBool($myData['is_online'] ?? 1),

            // Recursos
            'cards'                    => json_decode($myData['cards'] ?? '[]'),
            'max_hand_size'            => $maxHandSize,

            // Condiciones
            'conditions' => [
                'acting_boss'      => CastHelper::toBool($myData['acting_boss'] ?? 0),
                'is_blocked'       => CastHelper::toBool($myData['is_blocked'] ?? 0),
                'skip_next_turn'   => CastHelper::toBool($myData['skip_next_turn'] ?? 0),
                'must_discard'     => CastHelper::toBool($myData['must_discard'] ?? 0),
            ],

            // Perks
            'perks' => [
                'has_shield'        => CastHelper::toBool($myData['has_shield'] ?? 0),
                'vision_range'      => app(CombatService::class)->getPlayerRange($roomId, $playerId),
                'vision_bonus'      => (int) ($myData['vision_bonus'] ?? 0),
                'has_distance'      => (int) ($myData['has_distance'] ?? 0),
                'has_storage'       => CastHelper::toBool($myData['has_storage'] ?? 0),
                'has_luck'          => CastHelper::toBool($myData['has_luck'] ?? 0),
                'chaotic_passive'   => CastHelper::toBool($myData['chaotic_passive'] ?? 0),
            ],

            // Turno
            'turn_limits' => [
                'single_attack_used' => CastHelper::toBool($myData['single_attack_used_this_turn'] ?? 0),
                'multi_attack_used'  => CastHelper::toBool($myData['multi_attack_used_this_turn'] ?? 0),
            ],

            // Combate
            'combat_state' => [
                'is_defending_single' => $hasIncomingAttack,
                'is_defending_multi'  => $hasPendingMultiAttack,
                'is_attacking_single' => $hasPendingAttack,
                'is_attacking_multi'  => $hasPendingMultiAsAttacker,
            ],

            // Evento suerte
            'luck_challenge' => $challengeColors,
        ];
    }
}
