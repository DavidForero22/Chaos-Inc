<?php
// app/Support/GameDataFormatter.php
namespace App\Support;

use Illuminate\Support\Facades\Redis;
use App\Support\CastHelper;
use App\Services\LiveGame\GameFinalizationService;

class GameDataFormatter
{
    public static function formatMyData(string $playerName, array $myData, array $pendingAttack): array
    {
        $hasIncomingAttack = !empty($pendingAttack) && ($pendingAttack['target'] ?? null) === $playerName;
        $hasPendingAttack  = !empty($pendingAttack) && ($pendingAttack['attacker'] ?? null) === $playerName;

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
        ];
    }

    public static function formatGameData(string $roomId, array $room, string $myPlayerName): array
    {
        $opponents = [];
        $hasActingBoss = false;

        $finalizationService = app(GameFinalizationService::class);
        $isEffectivelyOver = $finalizationService->isGameEffectivelyOver($roomId);

        foreach (Redis::smembers("room:{$roomId}:players") as $pName) {
            $pData = Redis::hgetall("room:{$roomId}:player:{$pName}");

            // Comprobamos si alguien (incluso yo) es acting_boss
            if (CastHelper::toBool($pData['acting_boss'] ?? 0)) {
                $hasActingBoss = true;
            }

            if ($pName === $myPlayerName) continue;

            $pData = Redis::hgetall("room:{$roomId}:player:{$pName}");
            $opponents[] = [
                'name'        => $pName,
                'stress'      => (int) ($pData['stress'] ?? 0),
                'is_dead'     => CastHelper::toBool($pData['is_dead'] ?? 0),
                'role'        => ($pData['role'] === 'boss') ? 'boss' : 'hidden',
                'is_online'   => CastHelper::toBool($pData['is_online'] ?? 1),
                'cards_count' => count(json_decode($pData['cards'] ?? '[]', true) ?: []),
                'has_shield'  => CastHelper::toBool($pData['has_shield'] ?? 0),
            ];
        }

        return [
            'current_turn'      => $room['current_turn_player_id'] ?? null,
            'opponents'         => $opponents,
            'game_over'         => CastHelper::toBool($room['game_over'] ?? 0),
            'winner_role'       => $room['winner_role'] ?? null,
            'round_number'      => (int) ($room['round_number'] ?? 0),
            'deck_count'        => count(json_decode(Redis::get("room:{$roomId}:deck") ?? '[]', true)),
            'boss_disconnected'        => Redis::exists("room:{$roomId}:boss_grace_period"),
            'acting_boss_disconnected' => Redis::exists("room:{$roomId}:acting_boss_grace_period"),
            'ending_soon'              => Redis::exists("room:{$roomId}:ending_grace_period"),
            'has_acting_boss'          => $hasActingBoss,
            'effectively_over'         => $isEffectivelyOver,
        ];
    }
}
