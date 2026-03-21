<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Redis;
use App\Support\CastHelper;
use App\Services\LiveGame\GameFinalizationService;

class GameDataResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $roomId       = $this['roomId'];
        $room         = $this['room'];
        $myPlayerName = $this['myPlayerName'];

        $opponents = [];
        $hasActingBoss = false;

        $finalizationService = app(GameFinalizationService::class);
        $isEffectivelyOver   = $finalizationService->isGameEffectivelyOver($roomId);

        foreach (Redis::smembers("room:{$roomId}:players") as $pName) {
            $pData = Redis::hgetall("room:{$roomId}:player:{$pName}");

            if (CastHelper::toBool($pData['acting_boss'] ?? 0)) {
                $hasActingBoss = true;
            }

            if ($pName === $myPlayerName) continue;

            $opponents[] = [
                'name'        => $pName,
                'stress'      => (int) ($pData['stress'] ?? 0),
                'is_dead'     => CastHelper::toBool($pData['is_dead'] ?? 0),
                'role'        => ($pData['role'] === 'boss') ? 'boss' : 'hidden',
                'is_online'   => CastHelper::toBool($pData['is_online'] ?? 1),
                'cards_count' => count(json_decode($pData['cards'] ?? '[]', true) ?: []),
                'has_shield'  => CastHelper::toBool($pData['has_shield'] ?? 0),
                'is_blocked'  => CastHelper::toBool($pData['is_blocked'] ?? 0),
                'acting_boss' => CastHelper::toBool($pData['acting_boss'] ?? 0),
            ];
        }

        return [
            'current_turn'             => $room['current_turn_player_id'] ?? null,
            'opponents'                => $opponents,
            'game_over'                => CastHelper::toBool($room['game_over'] ?? 0),
            'winner_role'              => $room['winner_role'] ?? null,
            'round_number'             => (int) ($room['round_number'] ?? 0),
            'deck_count'               => count(json_decode(Redis::get("room:{$roomId}:deck") ?? '[]', true)),
            'boss_disconnected'        => Redis::exists("room:{$roomId}:boss_grace_period"),
            'acting_boss_disconnected' => Redis::exists("room:{$roomId}:acting_boss_grace_period"),
            'ending_soon'              => Redis::exists("room:{$roomId}:ending_grace_period"),
            'has_acting_boss'          => $hasActingBoss,
            'effectively_over'         => $isEffectivelyOver,
        ];
    }
}
