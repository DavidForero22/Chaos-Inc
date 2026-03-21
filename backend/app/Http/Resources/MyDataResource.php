<?php
// app/Http/Resources/MyDataResource.php

namespace App\Http\Resources;

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

        $challengeKey = "room:{$roomId}:luck_challenge:{$playerName}";
        $hasChallenge = Redis::exists($challengeKey);

        $challengeColors = null;
        if ($hasChallenge) {
            $colors = ['red', 'blue', 'green', 'yellow'];
            shuffle($colors);
            $challengeColors = $colors;
        }

        return [
            'name'                  => $playerName,
            'role'                  => $myData['role'],
            'stress'                => (int) $myData['stress'],
            'is_dead'               => CastHelper::toBool($myData['is_dead'] ?? 0),
            'cards'                 => json_decode($myData['cards'] ?? '[]'),
            'is_online'             => CastHelper::toBool($myData['is_online'] ?? 1),
            'skip_next_turn'        => CastHelper::toBool($myData['skip_next_turn'] ?? 0),
            'attack_used_this_turn' => CastHelper::toBool($myData['attack_used_this_turn'] ?? 0),
            'incoming_attack'       => $hasIncomingAttack,
            'has_pending_attack'    => $hasPendingAttack,
            'has_shield'            => CastHelper::toBool($myData['has_shield'] ?? 0),
            'acting_boss'           => CastHelper::toBool($myData['acting_boss'] ?? 0),
            'is_blocked'            => CastHelper::toBool($myData['is_blocked'] ?? 0),
            'luck_challenge'        => $challengeColors,
        ];
    }
}
