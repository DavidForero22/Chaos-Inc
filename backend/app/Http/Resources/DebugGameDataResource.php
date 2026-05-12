<?php

namespace App\Http\Resources;

use App\Services\Game\Engine\CombatService;
use App\Support\CastHelper;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Redis;

class DebugGameDataResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $roomId    = $this['roomId'];
        $roomState = Redis::hgetall("room:{$roomId}:state");

        $players       = [];
        $combatService = app(CombatService::class);

        foreach (Redis::smembers("room:{$roomId}:players") as $playerId) {
            $playerId = (string) $playerId;
            $base     = "room:{$roomId}:player:{$playerId}";

            $info      = Redis::hgetall("{$base}:info");
            $perks     = Redis::hgetall("{$base}:perks");
            $turnState = Redis::hgetall("{$base}:turn_state");
            $stats     = Redis::hgetall("{$base}:stats");
            $hand      = json_decode(Redis::get("{$base}:hand") ?: '[]', true);

            $role         = $info['role'] ?? 'union';
            $isActingBoss = CastHelper::toBool($info['acting_boss'] ?? 0);
            $maxStress    = ($role === 'boss' || $isActingBoss)
                ? 5
                : 4;

            $players[] = [
                // Identidad
                'id'          => $playerId,
                'name'        => $info['username'] ?? '',
                'role'        => $role,
                'is_ghost'    => CastHelper::toBool($info['is_ghost'] ?? 0),
                'is_guest'    => CastHelper::toBool($info['is_guest'] ?? 0),

                // Estado vital
                'stress'      => (int) ($info['stress'] ?? 0),
                'max_stress'  => $maxStress,
                'is_dead'     => CastHelper::toBool($info['is_dead'] ?? 0),
                'killer_name' => $info['killer_name'] ?? null,
                'is_online'   => CastHelper::toBool($info['is_online'] ?? 1),

                // Mano completa visible en debug
                'cards'       => $hand,

                // Condiciones
                'conditions'  => [
                    'acting_boss'    => $isActingBoss,
                    'is_blocked'     => CastHelper::toBool($perks['is_blocked'] ?? 0),
                    'skip_next_turn' => CastHelper::toBool($turnState['skip_next_turn'] ?? 0),
                    'must_discard'   => CastHelper::toBool($turnState['must_discard'] ?? 0),
                ],

                // Perks
                'perks'       => [
                    'has_shield'   => CastHelper::toBool($perks['has_shield'] ?? 0),
                    'has_storage'  => CastHelper::toBool($perks['has_storage'] ?? 0),
                    'has_luck'     => CastHelper::toBool($perks['has_luck'] ?? 0),
                    'has_distance' => CastHelper::toBool($perks['has_distance'] ?? 0),
                    'vision_bonus' => (int) ($perks['vision_bonus'] ?? 0),
                    'vision_range' => $combatService->getPlayerRange($roomId, $playerId),
                ],

                // Límites de turno
                'turn_limits' => [
                    'single_attack_used' => CastHelper::toBool($turnState['single_attack_used_this_turn'] ?? 0),
                    'multi_attack_used'  => CastHelper::toBool($turnState['multi_attack_used_this_turn'] ?? 0),
                ],

                // Stats completas (ocultas en partidas normales)
                'stats'       => [
                    'damage_dealt'    => (int) ($stats['damage_dealt'] ?? 0),
                    'damage_received' => (int) ($stats['damage_received'] ?? 0),
                    'healing_done'    => (int) ($stats['healing_done'] ?? 0),
                    'cards_played'    => (int) ($stats['cards_played'] ?? 0),
                    'passives_played' => (int) ($stats['passives_played'] ?? 0),
                    'eliminations'    => (int) ($stats['eliminations'] ?? 0),
                    'dodged_attacks'  => (int) ($stats['dodged_attacks'] ?? 0),
                    'cards_stolen'    => (int) ($stats['cards_stolen'] ?? 0),
                ],
            ];
        }

        return [
            'players'         => $players,
            'game_over'       => CastHelper::toBool($roomState['game_over'] ?? 0),
            'winner_role'     => $roomState['winner_role'] ?? null,
            'round_number'    => (int) ($roomState['round_number'] ?? 0),
            'deck_count'      => count(json_decode(Redis::get("room:{$roomId}:deck") ?? '[]', true)),
            'current_turn'    => $roomState['current_turn_player_id'] ?? null,

            // Sin temporizadores en modo debug
            'turn_timeout'    => null,
            'turn_expires_at' => null,
            'turn_remaining'  => null,
        ];
    }
}
