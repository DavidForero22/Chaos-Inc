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
    public function applyAttack(string $roomId, int $playerId, int $targetId): void
    {
        $playerTurnStateKey = "room:{$roomId}:player:{$playerId}:turn_state";
        $targetHandKey      = "room:{$roomId}:player:{$targetId}:hand";
        $targetPerksKey     = "room:{$roomId}:player:{$targetId}:perks";

        Redis::hset($playerTurnStateKey, 'single_attack_used_this_turn', 1);

        $targetCards = json_decode(Redis::get($targetHandKey) ?: '[]', true);

        $hasDodge  = !empty(array_filter(
            $targetCards,
            fn($c) => is_array($c) && (($c['card_id'] ?? null) === 3)
        ));

        $hasShield = Redis::hget($targetPerksKey, 'has_shield') === '1';

        if ($hasShield) {
            // El escudo bloquea el ataque y se rompe
            Redis::hset($targetPerksKey, 'has_shield', 0);
        } elseif ($hasDodge) {
            // Generar ID único para este ataque
            $attackToken = uniqid('single_attack_', true);

            // El objetivo puede esquivar, el ataque queda en pausa
            Redis::hmset("room:{$roomId}:pending_attack", [
                'attack_token' => $attackToken,
                'attacker'     => $playerId,
                'target'       => $targetId,
            ]);

            ResolveSingleAttackJob::dispatch(
                $roomId,
                $playerId,
                $targetId,
                $attackToken
            )->delay(18);
        } else {
            // Si no hay defensa, el daño entra directo
            app(CombatService::class)->applyDamageAndCheck(
                $roomId,
                $playerId,
                $targetId
            );
        }
    }

    public function applyHeal(string $roomId, int $playerId): void
    {
        $playerInfoKey = "room:{$roomId}:player:{$playerId}:info";

        $currentStress = (int) (
            Redis::hget($playerInfoKey, 'stress') ?? 0
        );

        if ($currentStress > 0) {
            Redis::hincrby($playerInfoKey, 'stress', -1);

            Redis::hincrby(
                "room:{$roomId}:player:{$playerId}:stats",
                'healing_done',
                1
            );
        }
    }

    public function applySteal(string $roomId, int $playerId, int $targetId): void
    {
        $playerHandKey = "room:{$roomId}:player:{$playerId}:hand";
        $targetHandKey = "room:{$roomId}:player:{$targetId}:hand";

        $targetCards = json_decode(
            Redis::get($targetHandKey) ?: '[]',
            true
        );

        if (empty($targetCards)) {
            return; // Prevenir errores si intentan robarle a alguien sin cartas
        }

        // Ejecución pura: Seleccionar carta aleatoria y la movemos
        $randomIndex = array_rand($targetCards);

        $stolenCard = $targetCards[$randomIndex];

        array_splice($targetCards, $randomIndex, 1);

        Redis::set($targetHandKey, json_encode($targetCards));

        $myCards = json_decode(
            Redis::get($playerHandKey) ?: '[]',
            true
        );

        if (!is_array($myCards)) {
            $myCards = [];
        }

        $myCards[] = $stolenCard;

        Redis::set($playerHandKey, json_encode($myCards));

        Redis::hincrby(
            "room:{$roomId}:player:{$playerId}:stats",
            'cards_stolen',
            1
        );
    }

    public function applyShield(string $roomId, int $playerId): void
    {
        Redis::hset(
            "room:{$roomId}:player:{$playerId}:perks",
            'has_shield',
            1
        );
    }

    public function applyBlock(string $roomId, int $targetId): void
    {
        Redis::hset(
            "room:{$roomId}:player:{$targetId}:perks",
            'is_blocked',
            1
        );
    }

    public function applyAttackAll(string $roomId, int $playerId): void
    {
        $playerTurnStateKey = "room:{$roomId}:player:{$playerId}:turn_state";

        Redis::hset(
            $playerTurnStateKey,
            'multi_attack_used_this_turn',
            1
        );

        $players = Redis::smembers("room:{$roomId}:players");

        $pendingTargets = [];
        $shieldUsers    = [];

        foreach ($players as $targetId) {
            if ((string) $targetId === (string) $playerId) {
                continue;
            }

            $targetInfoKey  = "room:{$roomId}:player:{$targetId}:info";
            $targetPerksKey = "room:{$roomId}:player:{$targetId}:perks";
            $targetHandKey  = "room:{$roomId}:player:{$targetId}:hand";

            $pInfo    = Redis::hgetall($targetInfoKey);

            $isDead   = CastHelper::toBool($pInfo['is_dead'] ?? false);
            $isOnline = ($pInfo['is_online'] ?? '1') !== '0';

            if ($isDead || !$isOnline) {
                continue;
            }

            $hasShield = Redis::hget(
                $targetPerksKey,
                'has_shield'
            ) === '1';

            $targetCards = json_decode(
                Redis::get($targetHandKey) ?: '[]',
                true
            );

            $hasDodge = !empty(array_filter(
                $targetCards,
                fn($c) => is_array($c) && (($c['card_id'] ?? null) === 3)
            ));

            if ($hasShield) {
                // Escudo absorbe y se rompe
                Redis::hset($targetPerksKey, 'has_shield', 0);

                $shieldUsers[] = (int) $targetId;
            } elseif ($hasDodge) {
                // Puede esquivar — añadir a pendientes
                $pendingTargets[] = (int) $targetId;
            } else {
                // Daño directo
                app(CombatService::class)->applyDamageAndCheck(
                    $roomId,
                    $playerId,
                    (int) $targetId
                );
            }
        }

        if (!empty($pendingTargets)) {
            // Generar ID único para este ataque
            $attackToken = uniqid('multi_attack_', true);

            Redis::set(
                "room:{$roomId}:pending_multi_attack",
                json_encode([
                    'attack_token' => $attackToken,
                    'attacker'     => $playerId,
                    'targets'      => $pendingTargets,
                    'dodgers'      => [],
                    'shielders'    => $shieldUsers,
                ])
            );

            ResolveMultiAttackJob::dispatch(
                $roomId,
                $attackToken
            )->delay(18);

            $attackerName = Redis::hget(
                "room:{$roomId}:player:{$playerId}:info",
                'username'
            ) ?? "Player {$playerId}";

            // Emitir evento para que el frontend actualice escudos rotos y muestre temporizadores
            event(new RoomStateUpdated(
                $roomId,
                __('game.multi_attack_started', [
                    'attacker' => $attackerName
                ])
            ));
        } else {
            // No hay nadie que deba decidir. Resolvemos al instante.
            $attackerName = Redis::hget(
                "room:{$roomId}:player:{$playerId}:info",
                'username'
            ) ?? "Player {$playerId}";

            $logMessage = __('game.attacked_all_resolved', [
                'attacker' => $attackerName
            ]);

            if (!empty($shieldUsers)) {
                $shieldNames = [];

                foreach ($shieldUsers as $shieldUserId) {
                    $shieldNames[] = Redis::hget(
                        "room:{$roomId}:player:{$shieldUserId}:info",
                        'username'
                    ) ?? "Player {$shieldUserId}";
                }

                $logMessage .= ' ' . __('game.shields_broken', [
                    'shielders' => implode(', ', $shieldNames)
                ]);
            }

            event(new RoomStateUpdated($roomId, $logMessage));
        }
    }

    public function applyHealAll(string $roomId, int $playerId): void
    {
        $players = Redis::smembers("room:{$roomId}:players");

        $casterStatsKey = "room:{$roomId}:player:{$playerId}:stats";

        foreach ($players as $targetId) {
            $targetInfoKey = "room:{$roomId}:player:{$targetId}:info";

            $pInfo         = Redis::hgetall($targetInfoKey);

            $isDead        = CastHelper::toBool($pInfo['is_dead'] ?? 0);
            $currentStress = (int) ($pInfo['stress'] ?? 0);

            if (!$isDead && $currentStress > 0) {
                Redis::hincrby($targetInfoKey, 'stress', -1);

                Redis::hincrby(
                    $casterStatsKey,
                    'healing_done',
                    1
                );
            }
        }
    }

    public function applySabotage(string $roomId, int $targetId): void
    {
        $turnStateKey = "room:{$roomId}:player:{$targetId}:turn_state";

        // Generar un token único para este sabotaje en concreto
        $sabotageId = uniqid('sabotage_', true);

        Redis::hset($turnStateKey, 'must_discard', 1);
        Redis::hset($turnStateKey, 'sabotage_id', $sabotageId);

        Redis::set(
            "room:{$roomId}:pending_sabotage",
            $targetId
        );

        // Pasar el token al Job
        ResolveSabotageJob::dispatch(
            $roomId,
            $targetId,
            $sabotageId
        )->delay(18);
    }

    public function applyVision(string $roomId, int $playerId): void
    {
        Redis::hincrby(
            "room:{$roomId}:player:{$playerId}:perks",
            'vision_bonus',
            1
        );
    }

    public function applyDistance(string $roomId, int $playerId): void
    {
        Redis::hset(
            "room:{$roomId}:player:{$playerId}:perks",
            'has_distance',
            1
        );
    }

    public function applyClean(string $roomId, int $targetId, string $perkKey): void
    {
        Redis::hset(
            "room:{$roomId}:player:{$targetId}:perks",
            $perkKey,
            0
        );
    }

    public function applyStorage(string $roomId, int $playerId): void
    {
        Redis::hset(
            "room:{$roomId}:player:{$playerId}:perks",
            'has_storage',
            1
        );
    }

    public function applyLuck(string $roomId, int $playerId): void
    {
        Redis::hset(
            "room:{$roomId}:player:{$playerId}:perks",
            'has_luck',
            1
        );
    }

    public function applyChaoticDraw(string $roomId, int $playerId): void
    {
        $playerIds = Redis::smembers("room:{$roomId}:players");
        $stolenCards = [];
        $stolenFrom = [];

        // Recopilar primero quiénes son los oponentes válidos (vivos y online)
        $validOpponents = [];
        foreach ($playerIds as $targetId) {
            $targetId = (string) $targetId;

            // No robarse a sí mismo
            if ($targetId === (string) $playerId) continue;

            $info = Redis::hgetall("room:{$roomId}:player:{$targetId}:info");
            if (($info['is_dead'] ?? 0) == 0 && ($info['is_online'] ?? 1) == 1) {
                $validOpponents[] = $targetId;
            }
        }

        $opponentsCount = count($validOpponents);

        // Si no hay oponentes válidos, no hacemos nada
        if ($opponentsCount === 0) {
            return;
        }

        // Lógica de balanceo dinámico 
        $cardsToStealPerOpponent = 1;
        if ($opponentsCount === 1) {
            $cardsToStealPerOpponent = 3; // En un 1v1, le roba 3
        } elseif ($opponentsCount === 2) {
            $cardsToStealPerOpponent = 2; // En un 1v2, roba 2 a cada uno
        } elseif ($opponentsCount >= 3) {
            $cardsToStealPerOpponent = 1; // En partidas llenas, roba 1 a cada uno
        }

        // Ejecutar el asalto
        foreach ($validOpponents as $targetId) {
            $handKey = "room:{$roomId}:player:{$targetId}:hand";
            $hand = json_decode(Redis::get($handKey) ?: '[]', true);

            // Robar hasta el límite establecido (o hasta dejarlo sin cartas)
            $stolenThisTurn = 0;
            while (!empty($hand) && $stolenThisTurn < $cardsToStealPerOpponent) {
                // Elegir carta aleatoria
                $randomIndex = array_rand($hand);
                $stolenCard = $hand[$randomIndex];

                // Eliminar del objetivo
                array_splice($hand, $randomIndex, 1);

                // Añadir al botín general
                $stolenCards[] = $stolenCard;
                $stolenFrom[] = $targetId;

                $stolenThisTurn++;
            }

            // Actualizar la mano del oponente en Redis si le ha robado algo
            if ($stolenThisTurn > 0) {
                Redis::set($handKey, json_encode($hand));

                // Actualizar las estadísticas de robo del jugador actual
                Redis::hincrby("room:{$roomId}:player:{$playerId}:stats", 'cards_stolen', $stolenThisTurn);
            }
        }

        // Entregar las cartas al jugador que lanzó la carta
        if (!empty($stolenCards)) {
            $currentHandKey = "room:{$roomId}:player:{$playerId}:hand";
            $currentHand = json_decode(Redis::get($currentHandKey) ?: '[]', true);
            $currentHand = array_merge($currentHand, $stolenCards);
            Redis::set($currentHandKey, json_encode($currentHand));

            // Registrar nuevos descubrimientos para la galería/logros
            $knownKey = "room:{$roomId}:player:{$playerId}:known_cards";
            $newKey   = "room:{$roomId}:player:{$playerId}:new_cards";

            foreach ($stolenCards as $card) {
                $cardBaseId = (string) $card['card_id'];
                if (!Redis::sismember($knownKey, $cardBaseId)) {
                    Redis::sadd($newKey, $cardBaseId);
                }
            }
        }
    }


    public function applyChaoticPassive(string $roomId, int $playerId): void
    {
        Redis::hset("room:{$roomId}:player:{$playerId}:perks", 'has_potato_launcher', 1);
    }

    public function applyChaoticRevive(string $roomId, string $targetId): void
    {
        // Revivir al objetivo
        $targetInfoKey = "room:{$roomId}:player:{$targetId}:info";
        Redis::hset($targetInfoKey, 'is_dead', 0);
        Redis::hset($targetInfoKey, 'stress', 2);
        // Limpiar posibles efectos negativos
        Redis::hset("room:{$roomId}:player:{$targetId}:turn_state", 'skip_next_turn', 0);
        Redis::hset("room:{$roomId}:player:{$targetId}:perks", 'is_blocked', 0);
    }
}
