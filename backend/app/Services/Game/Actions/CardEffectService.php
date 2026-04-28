<?php
// app/Services/Game/Actions/CardEffectService.php

namespace App\Services\Game\Actions;

use App\Events\RoomStateUpdated;
use App\Jobs\ResolveMultiAttackJob;
use App\Jobs\ResolveSabotageJob;
use App\Jobs\ResolveSingleAttackJob;
use App\Services\Game\Engine\CombatService;
use App\Support\CastHelper;
use Illuminate\Support\Facades\Redis;

class CardEffectService
{
    public function applyAttack(string $roomId, string $playerName, string $targetName): ?string
    {
        $playerTurnStateKey = "room:{$roomId}:player:{$playerName}:turn_state";
        $targetHandKey      = "room:{$roomId}:player:{$targetName}:hand";
        $targetPerksKey     = "room:{$roomId}:player:{$targetName}:perks";

        Redis::hset($playerTurnStateKey, 'single_attack_used_this_turn', 1);

        $targetCards = json_decode(Redis::get($targetHandKey) ?: '[]', true);

        $hasDodge    = !empty(array_filter($targetCards, fn($c) => is_array($c) && ($c['card_id'] ?? null) === 3));
        $hasShield   = Redis::hget($targetPerksKey, 'has_shield') === '1';

        if ($hasShield) {
            // El escudo bloquea el ataque y se rompe
            Redis::hset($targetPerksKey, 'has_shield', 0);
            return 'shield_broken';
        } elseif ($hasDodge) {
            // El objetivo puede esquivar, el ataque queda en pausa
            Redis::hmset("room:{$roomId}:pending_attack", [
                'attacker' => $playerName,
                'target'   => $targetName,
            ]);

            ResolveSingleAttackJob::dispatch($roomId, $playerName, $targetName)->delay(15);
            return null;
        } else {
            // Si no hay defensa, el daño entra directo
            app(CombatService::class)->applyDamageAndCheck($roomId, $playerName, $targetName);
            return 'direct_damage';
        }
    }

    public function applyHeal(string $roomId, string $playerName): void
    {
        $playerInfoKey = "room:{$roomId}:player:{$playerName}:info";
        $currentStress = (int) (Redis::hget($playerInfoKey, 'stress') ?? 0);

        if ($currentStress > 0) {
            Redis::hincrby($playerInfoKey, 'stress', -1);
        }
    }

    public function applySteal(string $roomId, string $playerName, string $targetName): void
    {
        $playerHandKey = "room:{$roomId}:player:{$playerName}:hand";
        $targetHandKey = "room:{$roomId}:player:{$targetName}:hand";

        $targetCards = json_decode(Redis::get($targetHandKey) ?: '[]', true);

        if (empty($targetCards)) {
            return; // Prevenir errores si intentan robarle a alguien sin cartas
        }

        // Ejecución pura: Seleccionar carta aleatoria y la movemos
        $randomIndex = array_rand($targetCards);
        $stolenCard  = $targetCards[$randomIndex];
        array_splice($targetCards, $randomIndex, 1);

        Redis::set($targetHandKey, json_encode($targetCards));

        $myCards = json_decode(Redis::get($playerHandKey) ?: '[]', true);
        if (!is_array($myCards)) $myCards = [];

        $myCards[] = $stolenCard;
        Redis::set($playerHandKey, json_encode($myCards));
    }

    public function applyShield(string $roomId, string $playerName): void
    {
        Redis::hset("room:{$roomId}:player:{$playerName}:perks", 'has_shield', 1);
    }

    public function applyBlock(string $roomId, string $targetName): void
    {
        Redis::hset("room:{$roomId}:player:{$targetName}:perks", 'is_blocked', 1);
    }

    public function applyAttackAll(string $roomId, string $playerName): void
    {
        $playerTurnStateKey = "room:{$roomId}:player:{$playerName}:turn_state";

        Redis::hset($playerTurnStateKey, 'multi_attack_used_this_turn', 1);

        $players = Redis::smembers("room:{$roomId}:players");
        $pendingTargets = [];
        $shieldUsers = [];

        foreach ($players as $target) {
            if ($target === $playerName) continue;

            $targetInfoKey  = "room:{$roomId}:player:{$target}:info";
            $targetPerksKey = "room:{$roomId}:player:{$target}:perks";
            $targetHandKey  = "room:{$roomId}:player:{$target}:hand";

            $pInfo    = Redis::hgetall($targetInfoKey);
            $isDead   = CastHelper::toBool($pInfo['is_dead'] ?? false);
            $isOnline = ($pInfo['is_online'] ?? '1') !== '0';

            if ($isDead || !$isOnline) continue;

            $hasShield   = Redis::hget($targetPerksKey, 'has_shield') === '1';
            $targetCards = json_decode(Redis::get($targetHandKey) ?: '[]', true);
            $hasDodge    = !empty(array_filter($targetCards, fn($c) => is_array($c) && ($c['card_id'] ?? null) === 3));

            if ($hasShield) {
                // Escudo absorbe y se rompe
                Redis::hset($targetPerksKey, 'has_shield', 0);
                $shieldUsers[] = $target; // Guardar quién gastó escudo
            } elseif ($hasDodge) {
                // Puede esquivar — añadir a pendientes
                $pendingTargets[] = $target;
            } else {
                // Daño directo
                app(CombatService::class)->applyDamageAndCheck($roomId, $playerName, $target);
            }
        }

        if (!empty($pendingTargets)) {
            Redis::set(
                "room:{$roomId}:pending_multi_attack",
                json_encode([
                    'attacker'  => $playerName,
                    'targets'   => $pendingTargets,
                    'dodgers'   => [],
                    'shielders' => $shieldUsers,
                ])
            );

            ResolveMultiAttackJob::dispatch($roomId)->delay(18);

            // Emitir evento para que el frontend actualice escudos rotos y muestre temporizadores
            event(new RoomStateUpdated($roomId, __('game.multi_attack_started', ['attacker' => $playerName])));
        } else {
            // No hay nadie que deba decidir. Resolvemos al instante.
            $logMessage = __('game.attacked_all_resolved', ['attacker' => $playerName]);
            if (!empty($shieldUsers)) {
                $logMessage .= ' ' . __('game.shields_broken', ['shielders' => implode(', ', $shieldUsers)]);
            }
            event(new RoomStateUpdated($roomId, $logMessage));
        }
    }

    public function applyHealAll(string $roomId): void
    {
        $players = Redis::smembers("room:{$roomId}:players");

        foreach ($players as $target) {
            $targetInfoKey = "room:{$roomId}:player:{$target}:info";

            $pInfo         = Redis::hgetall($targetInfoKey);
            $isDead        = CastHelper::toBool($pInfo['is_dead'] ?? 0);
            $currentStress = (int) ($pInfo['stress'] ?? 0);

            if (!$isDead && $currentStress > 0) {
                Redis::hincrby($targetInfoKey, 'stress', -1);
            }
        }
    }

    public function applySabotage(string $roomId, string $playerName, string $targetName): void
    {
        $turnStateKey = "room:{$roomId}:player:{$targetName}:turn_state";

        Redis::hset($turnStateKey, 'must_discard', 1);
        Redis::hset($turnStateKey, 'must_discard_by', $playerName);

        Redis::set("room:{$roomId}:pending_sabotage", $targetName);

        ResolveSabotageJob::dispatch($roomId, $targetName)->delay(15);
    }

    public function applyVision(string $roomId, string $playerName): void
    {
        Redis::hincrby("room:{$roomId}:player:{$playerName}:perks", 'vision_bonus', 1);
    }

    public function applyDistance(string $roomId, string $playerName): void
    {
        Redis::hset("room:{$roomId}:player:{$playerName}:perks", 'has_distance', 1);
    }

    public function applyClean(string $roomId, string $targetName, string $perkKey): void
    {
        Redis::hset("room:{$roomId}:player:{$targetName}:perks", $perkKey, 0);
    }

    public function applyStorage(string $roomId, string $playerName): void
    {
        Redis::hset("room:{$roomId}:player:{$playerName}:perks", 'has_storage', 1);
    }

    public function applyLuck(string $roomId, string $playerName): void
    {
        Redis::hset("room:{$roomId}:player:{$playerName}:perks", 'has_luck', 1);
    }
}
