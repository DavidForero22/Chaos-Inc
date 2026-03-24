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
        $playerName    = $this['playerName'];
        $myData        = $this['myData'];
        $pendingAttack = $this['pendingAttack'];
        $roomId        = $this['roomId'];

        $hasIncomingAttack = !empty($pendingAttack) && ($pendingAttack['target'] ?? null) === $playerName;
        $hasPendingAttack  = !empty($pendingAttack) && ($pendingAttack['attacker'] ?? null) === $playerName;

        $pendingMultiAttack = $this['pendingMultiAttack'] ?? null;
        $hasPendingMultiAttack = !empty($pendingMultiAttack)
            && in_array($playerName, $pendingMultiAttack['targets'] ?? []);

        $hasPendingMultiAsAttacker = !empty($pendingMultiAttack)
            && ($pendingMultiAttack['attacker'] ?? null) === $playerName
            && !empty($pendingMultiAttack['targets'] ?? []);

        $challengeKey = "room:{$roomId}:luck_challenge:{$playerName}";
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

        $maxHandSize = max(1, ($maxStress + 1) - $currentStress);

        return [
            // Identidad y Vitalidad (Base)
            'name'                      => $playerName,
            'role'                      => $myData['role'],
            'stress'                    => $currentStress,
            'range'                     => app(CombatService::class)->getPlayerRange($roomId, $playerName),
            'is_dead'                   => CastHelper::toBool($myData['is_dead'] ?? 0),
            'is_online'                 => CastHelper::toBool($myData['is_online'] ?? 1),

            // Recursos del jugador
            'cards'                     => json_decode($myData['cards'] ?? '[]'),
            'max_hand_size'             => $maxHandSize,

            // Condiciones / Estados alterados (Buffs / Debuffs)
            'conditions'     => [
                'has_shield'            => CastHelper::toBool($myData['has_shield'] ?? 0),
                'acting_boss'           => CastHelper::toBool($myData['acting_boss'] ?? 0),
                'is_blocked'            => CastHelper::toBool($myData['is_blocked'] ?? 0),
                'skip_next_turn'        => CastHelper::toBool($myData['skip_next_turn'] ?? 0),
                'must_discard'          => CastHelper::toBool($myData['must_discard'] ?? 0),
                'must_discard_by'       => $myData['must_discard_by'] ?? null,
            ],

            // Límites del turno actual
            'turn_limits'    => [
                'single_attack_used'    => CastHelper::toBool($myData['single_attack_used_this_turn'] ?? 0),
                'multi_attack_used'     => CastHelper::toBool($myData['multi_attack_used_this_turn'] ?? 0),
            ],

            // Estado de Combate (Acciones pendientes)
            'combat_state'   => [
                'is_defending_single'  => $hasIncomingAttack,
                'is_defending_multi'   => $hasPendingMultiAttack,
                'is_attacking_single'  => $hasPendingAttack,
                'is_attacking_multi'   => $hasPendingMultiAsAttacker,
                'attacker_name_single' => $hasIncomingAttack ? ($pendingAttack['attacker'] ?? null) : null,
                'attacker_name_multi'  => $hasPendingMultiAttack ? ($pendingMultiAttack['attacker'] ?? null) : null,
            ],

            // Eventos especiales
            'luck_challenge'           => $challengeColors,
        ];
    }
}
