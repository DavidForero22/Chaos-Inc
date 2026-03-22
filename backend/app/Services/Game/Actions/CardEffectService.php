<?php
// app/Services/Game/Actions/CardEffectService.php

namespace App\Services\Game\Actions;

use App\Events\RoomStateUpdated;
use App\Jobs\ResolveMultiAttackJob;
use App\Support\CastHelper;
use Illuminate\Support\Facades\Redis;

class CardEffectService
{
    public function applyAttack(string $roomId, string $playerName, string $targetName): ?string
    {
        $playerKey = "room:{$roomId}:player:{$playerName}";
        $targetKey = "room:{$roomId}:player:{$targetName}";

        Redis::hset($playerKey, 'single_attack_used_this_turn', 1);

        $targetCards = json_decode(Redis::hget($targetKey, 'cards') ?: '[]', true);
        $hasDodge    = !empty(array_filter($targetCards, fn($c) => is_array($c) && ($c['type'] ?? null) === 3));
        $hasShield   = Redis::hget($targetKey, 'has_shield') === '1';

        if ($hasShield) {
            // El escudo bloquea el ataque y se rompe
            Redis::hset($targetKey, 'has_shield', 0);
            return 'shield_broken';
        } elseif ($hasDodge) {
            // El objetivo puede esquivar, el ataque queda en pausa
            Redis::hmset("room:{$roomId}:pending_attack", [
                'attacker' => $playerName,
                'target'   => $targetName,
            ]);
            return null;
        } else {
            // Si no hay defensa, el daño entra directo
            app(GameActionService::class)->applyDamageAndCheck($roomId, $playerName, $targetName);
            return 'direct_damage';
        }
    }

    public function applyHeal(string $roomId, string $playerName): void
    {
        $playerKey = "room:{$roomId}:player:{$playerName}";
        $currentStress = (int) (Redis::hget($playerKey, 'stress') ?? 0);

        if ($currentStress > 0) {
            Redis::hincrby($playerKey, 'stress', -1);
        }
    }

    public function applySteal(string $roomId, string $playerName, string $targetName): void
    {
        $playerKey   = "room:{$roomId}:player:{$playerName}";
        $targetKey   = "room:{$roomId}:player:{$targetName}";

        $targetCards = json_decode(Redis::hget($targetKey, 'cards') ?: '[]', true);

        // Ejecución pura: Seleccionar carta aleatoria y la movemos
        $randomIndex = array_rand($targetCards);
        $stolenCard  = $targetCards[$randomIndex];
        array_splice($targetCards, $randomIndex, 1);
        Redis::hset($targetKey, 'cards', json_encode($targetCards));

        $myCards = json_decode(Redis::hget($playerKey, 'cards') ?: '[]', true);
        if (!is_array($myCards)) $myCards = [];
        $myCards[] = $stolenCard;
        Redis::hset($playerKey, 'cards', json_encode($myCards));
    }

    public function applyShield(string $roomId, string $playerName): void
    {
        $playerKey = "room:{$roomId}:player:{$playerName}";
        Redis::hset($playerKey, 'has_shield', 1);
    }

    public function applyBlock(string $roomId, string $targetName): void
    {
        Redis::hset("room:{$roomId}:player:{$targetName}", 'is_blocked', 1);
    }

    public function applyAttackAll(string $roomId, string $playerName): void
    {
        $playerKey = "room:{$roomId}:player:{$playerName}";

        Redis::hset($playerKey, 'multi_attack_used_this_turn', 1);

        $players = Redis::smembers("room:{$roomId}:players");
        $pendingTargets = [];
        $shieldUsers = [];

        foreach ($players as $target) {
            if ($target === $playerName) continue;

            $targetKey = "room:{$roomId}:player:{$target}";
            $pData     = Redis::hgetall($targetKey);
            $isDead    = CastHelper::toBool($pData['is_dead'] ?? false);
            $isOnline  = ($pData['is_online'] ?? '1') !== '0';

            if ($isDead || !$isOnline) continue;

            $hasShield = ($pData['has_shield'] ?? '0') === '1';
            $targetCards = json_decode($pData['cards'] ?? '[]', true);
            $hasDodge  = !empty(array_filter($targetCards, fn($c) => is_array($c) && ($c['type'] ?? null) === 3));

            if ($hasShield) {
                // Escudo absorbe y se rompe
                Redis::hset($targetKey, 'has_shield', 0);
                $shieldUsers[] = $target; // Guardamos quién gastó escudo
            } elseif ($hasDodge) {
                // Puede esquivar — añadir a pendientes
                $pendingTargets[] = $target;
            } else {
                // Daño directo
                app(GameActionService::class)->applyDamageAndCheck($roomId, $playerName, $target);
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

            ResolveMultiAttackJob::dispatch($roomId)->delay(15);

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
            $targetKey   = "room:{$roomId}:player:{$target}";
            $pData       = Redis::hgetall($targetKey);
            $isDead    = CastHelper::toBool($pData['is_dead'] ?? 0);
            $currentStress = (int) ($pData['stress'] ?? 0);

            if (!$isDead && $currentStress > 0) {
                Redis::hincrby($targetKey, 'stress', -1);
            }
        }
    }

    public function applySabotage(string $roomId, string $playerName, string $targetName): void
    {
        Redis::hset("room:{$roomId}:player:{$targetName}", 'must_discard', 1);
        Redis::hset("room:{$roomId}:player:{$targetName}", 'must_discard_by', $playerName);
        Redis::set("room:{$roomId}:pending_sabotage", $targetName);
    }
}
