<?php
// app/Http/Resources/GameDataResource.php

namespace App\Http\Resources;

use App\Services\Game\Engine\CombatService;
use App\Services\Game\Status\GameFinalizationService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Redis;
use App\Support\CastHelper;
use App\Models\User;

class GameDataResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $roomId       = $this['roomId'];
        $myPlayerId   = $this['myPlayerId'];

        $roomInfo  = Redis::hgetall("room:{$roomId}:info");
        $roomState = Redis::hgetall("room:{$roomId}:state");

        $opponents = [];
        $hasActingBoss = false;
        $playerInLuckChallenge = null;

        $finalizationService = app(GameFinalizationService::class);
        $combatService       = app(CombatService::class);

        $isEffectivelyOver = $finalizationService->isGameEffectivelyOver($roomId);
        $myRange = $combatService->getPlayerRange($roomId, $myPlayerId);

        foreach (Redis::smembers("room:{$roomId}:players") as $playerId) {

            $playerId = (string) $playerId;

            // Saltar si es el mismo jugador
            if ($playerId === $myPlayerId) continue;

            $pInfoKey  = "room:{$roomId}:player:{$playerId}:info";
            $pPerksKey = "room:{$roomId}:player:{$playerId}:perks";
            $pHandKey  = "room:{$roomId}:player:{$playerId}:hand";

            $pInfo  = Redis::hgetall($pInfoKey);
            $pPerks = Redis::hgetall($pPerksKey);

            $pHandJson = Redis::get($pHandKey);
            $pHand = $pHandJson ? json_decode($pHandJson, true) : [];

            if (CastHelper::toBool($pInfo['acting_boss'] ?? 0)) {
                $hasActingBoss = true;
            }

            // Reto de suerte
            if (Redis::exists("room:{$roomId}:luck_challenge:{$playerId}")) {
                $playerInLuckChallenge = $playerId;
            }

            if ($playerId === $myPlayerId) continue;

            $distance = $combatService->getDistance($roomId, $myPlayerId, $playerId);

            $opponents[] = [
                'id'          => $playerId,
                'name'        => $pInfo['username'],
                'avatar'      => self::resolveAvatar($pInfo),

                // :info
                'stress'      => (int) ($pInfo['stress'] ?? 0),
                'is_dead'     => CastHelper::toBool($pInfo['is_dead'] ?? 0),
                'killer_name' => $pInfo['killer_name'] ?? null,
                'role'        => (($pInfo['role'] ?? '') === 'boss') ? 'boss' : 'hidden',
                'is_online'   => CastHelper::toBool($pInfo['is_online'] ?? 1),

                // :hand
                'cards_count' => count($pHand),
                'distance'    => $distance,
                'is_in_range' => $distance <= $myRange,

                // Condiciones
                'conditions'  => [
                    'acting_boss' => CastHelper::toBool($pInfo['acting_boss'] ?? 0),
                    'is_blocked'  => CastHelper::toBool($pPerks['is_blocked'] ?? 0),
                ],

                // :perks
                'perks'       => [
                    'has_shield'   => CastHelper::toBool($pPerks['has_shield'] ?? 0),
                    'vision_range' => $combatService->getPlayerRange($roomId, $playerId),
                    'vision_bonus' => (int) ($pPerks['vision_bonus'] ?? 0),
                    'has_distance' => CastHelper::toBool($pPerks['has_distance'] ?? 0) ? 1 : 0,
                    'has_storage'  => CastHelper::toBool($pPerks['has_storage'] ?? 0),
                    'has_luck'     => CastHelper::toBool($pPerks['has_luck'] ?? 0),
                ],
            ];
        }

        // Ataques pendientes
        $pendingAttackTarget = null;
        if (Redis::exists("room:{$roomId}:pending_attack")) {
            $pendingAttackTarget = Redis::hget("room:{$roomId}:pending_attack", 'target');
        }

        $pendingMultiAttackTargets = [];
        if (Redis::exists("room:{$roomId}:pending_multi_attack")) {
            $pendingMultiData = json_decode(Redis::get("room:{$roomId}:pending_multi_attack"), true);
            $pendingMultiAttackTargets = $pendingMultiData['targets'] ?? [];
        }

        $turnTimeout = (int) ($roomInfo['turn_timeout'] ?? 30);
        $turnExpiresAt = (int) ($roomState['turn_expires_at'] ?? 0);

        return [
            'current_turn'              => $roomState['current_turn_player_id'] ?? null,
            'opponents'                => $opponents,
            'game_over'                => CastHelper::toBool($roomState['game_over'] ?? 0),
            'winner_role'              => $roomState['winner_role'] ?? null,
            'round_number'             => (int) ($roomState['round_number'] ?? 0),

            'deck_count'               => count(json_decode(Redis::get("room:{$roomId}:deck") ?? '[]', true)),

            'boss_disconnected'        => Redis::exists("room:{$roomId}:boss_grace_period"),
            'acting_boss_disconnected' => Redis::exists("room:{$roomId}:acting_boss_grace_period"),
            'ending_soon'              => Redis::exists("room:{$roomId}:ending_grace_period"),
            'has_acting_boss'          => $hasActingBoss,
            'effectively_over'         => $isEffectivelyOver,

            'pending_single_attack_target' => $pendingAttackTarget,
            'pending_multi_attack_targets'  => $pendingMultiAttackTargets,
            'player_in_luck_challenge'      => $playerInLuckChallenge,
            'player_pending_sabotage'       => $this->getPlayerPendingSabotage($roomId),

            'turn_timeout'             => $turnTimeout,
            'turn_expires_at'          => $turnExpiresAt,
            'turn_remaining'           => max(0, $turnExpiresAt - now('UTC')->timestamp),
        ];
    }

    private static function resolveAvatar(array $pInfo): ?string
    {
        // Mirar si el avatar ya está guardado en el hash de Redis
        $avatar = $pInfo['avatar'] ?? null;
        if (!empty($avatar)) {
            return $avatar;
        }

        // Si no está en Redis, consultar la Base de Datos usando el ID
        $userId = $pInfo['user_id'] ?? null;

        if ($userId) {
            static $cache = [];

            if (array_key_exists($userId, $cache)) {
                return $cache[$userId];
            }

            $user = User::select('avatar')->find($userId);

            $cache[$userId] = $user ? $user->avatar : null;

            return $cache[$userId];
        }

        return null;
    }

    private static function getPlayerPendingSabotage(string $roomId): ?string
    {
        return Redis::get("room:{$roomId}:pending_sabotage") ?: null;
    }
}
