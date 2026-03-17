<?php

namespace App\Services\LiveGame;

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
}
