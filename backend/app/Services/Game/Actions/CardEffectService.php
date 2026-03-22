<?php
// app/Services/Game/Actions/CardEffectService.php

namespace App\Services\Game\Actions;

use App\Jobs\ResolveMultiAttackJob;
use App\Support\CastHelper;
use Illuminate\Support\Facades\Redis;

class CardEffectService
{
    public function applyAttack(string $roomId, string $playerName, string $targetName): void
    {
        $playerKey = "room:{$roomId}:player:{$playerName}";
        $targetKey = "room:{$roomId}:player:{$targetName}";

        // Marcar que ya usó un ataque este turno
        Redis::hset($playerKey, 'attack_used_this_turn', 1);

        $targetCards = json_decode(Redis::hget($targetKey, 'cards') ?: '[]', true);
        $hasDodge    = !empty(array_filter($targetCards, fn($c) => is_array($c) && ($c['type'] ?? null) === 3));
        $hasShield   = Redis::hget($targetKey, 'has_shield') === '1';

        if ($hasShield) {
            // El escudo bloquea el ataque y se rompe
            Redis::hset($targetKey, 'has_shield', 0);
        } elseif ($hasDodge) {
            // El objetivo puede esquivar, el ataque queda en pausa
            Redis::hmset("room:{$roomId}:pending_attack", [
                'attacker' => $playerName,
                'target'   => $targetName,
            ]);
        } else {
            // Si no hay defensa, el daño entra directo
            app(GameActionService::class)->applyDamageAndCheck($roomId, $playerName, $targetName);
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
        Redis::hset($playerKey, 'attack_used_this_turn', 1);

        $players = Redis::smembers("room:{$roomId}:players");
        $pendingTargets = [];

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
                    'attacker' => $playerName,
                    'targets'  => $pendingTargets,
                    'dodgers'  => [],
                ])
            );
        }

        ResolveMultiAttackJob::dispatch($roomId)->delay(15);
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
}
