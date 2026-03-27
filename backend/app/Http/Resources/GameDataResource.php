<?php
// app/Http/Resources/GameDataResource.php

namespace App\Http\Resources;

use App\Services\Game\Engine\CombatService;
use App\Services\Game\Status\GameFinalizationService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Redis;
use App\Support\CastHelper;

class GameDataResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $roomId       = $this['roomId'];
        $room         = $this['room'];
        $myPlayerName = $this['myPlayerName'];

        $opponents = [];
        $hasActingBoss = false;
        $playerInLuckChallenge = null;

        $finalizationService = app(GameFinalizationService::class);
        $combatService       = app(CombatService::class);

        $isEffectivelyOver   = $finalizationService->isGameEffectivelyOver($roomId);
        $activePlayersInOrder = $combatService->getActivePlayersInOrder($roomId);

        $myRange = $combatService->getPlayerRange($roomId, $myPlayerName);

        foreach (Redis::smembers("room:{$roomId}:players") as $pName) {
            $pData = Redis::hgetall("room:{$roomId}:player:{$pName}");

            if (CastHelper::toBool($pData['acting_boss'] ?? 0)) {
                $hasActingBoss = true;
            }

            // Detectar si este jugador está en un reto de suerte
            if (Redis::exists("room:{$roomId}:luck_challenge:{$pName}")) {
                $playerInLuckChallenge = $pName;
            }

            if ($pName === $myPlayerName) continue;

            $distance = $combatService->getDistance($roomId, $myPlayerName, $pName);

            $opponents[] = [
                'name'        => $pName,
                'stress'      => (int) ($pData['stress'] ?? 0),
                'is_dead'     => CastHelper::toBool($pData['is_dead'] ?? 0),
                'role'        => ($pData['role'] === 'boss') ? 'boss' : 'hidden',
                'is_online'   => CastHelper::toBool($pData['is_online'] ?? 1),
                'cards_count' => count(json_decode($pData['cards'] ?? '[]', true) ?: []),
                'distance'    => $distance,
                'is_in_range' => $distance <= $myRange,

                // --- Condiciones ---
                'conditions'  => [
                    'acting_boss' => CastHelper::toBool($pData['acting_boss'] ?? 0),
                    'is_blocked'  => CastHelper::toBool($pData['is_blocked'] ?? 0),
                ],

                // --- Beneficios (Buffos) ---
                'perks'       => [
                    'has_shield'  => CastHelper::toBool($pData['has_shield'] ?? 0),
                    'vision_range' => app(CombatService::class)->getPlayerRange($roomId, $pName),
                    'vision_bonus' => (int) ($pData['vision_bonus'] ?? 0),
                    'distance_bonus' => (int) ($pData['distance_bonus'] ?? 0),
                    'has_storage' => CastHelper::toBool($myData['has_storage'] ?? 0),
                ],
            ];
        }

        // Obtener datos de ataques pendientes
        $pendingAttackTarget = null;
        if (Redis::exists("room:{$roomId}:pending_attack")) {
            $pendingAttackTarget = Redis::hget("room:{$roomId}:pending_attack", 'target');
        }

        $pendingMultiAttackTargets = [];
        if (Redis::exists("room:{$roomId}:pending_multi_attack")) {
            $pendingMultiData = json_decode(Redis::get("room:{$roomId}:pending_multi_attack"), true);
            $pendingMultiAttackTargets = $pendingMultiData['targets'] ?? [];
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

            'pending_single_attack_target' => $pendingAttackTarget,
            'pending_multi_attack_targets' => $pendingMultiAttackTargets,
            'player_in_luck_challenge'     => $playerInLuckChallenge,
            'player_pending_sabotage'      => $this->getPlayerPendingSabotage($roomId),
        ];
    }

    private static function getPlayerPendingSabotage(string $roomId): ?string
    {
        return Redis::get("room:{$roomId}:pending_sabotage") ?: null;
    }
}
