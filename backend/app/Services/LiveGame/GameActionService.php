<?php

namespace App\Services\LiveGame;

use App\Events\RoomStateUpdated;
use App\Exceptions\GameException;
use App\Exceptions\RoomException;
use Illuminate\Support\Facades\Redis;

class GameActionService
{
    public function playAction(string $roomId, string $playerName, string $cardId, string $targetName): void
    {
        $roomKey = "room:{$roomId}";

        if (!Redis::exists($roomKey)) {
            throw new RoomException(RoomException::ROOM_NOT_FOUND, "The room does not exist.", 404);
        }

        $currentTurn = Redis::hget($roomKey, 'current_turn_player_id');
        if ($currentTurn !== $playerName) {
            throw new GameException(GameException::NOT_YOUR_TURN, "No es tu turno.", 403);
        }

        if (Redis::exists("room:{$roomId}:pending_attack")) {
            throw new GameException(GameException::INVALID_ACTION, "Hay un ataque pendiente de resolver.", 422);
        }

        if (!Redis::sismember("{$roomKey}:players", $targetName)) {
            throw new GameException(GameException::INVALID_TARGET, "El jugador objetivo no está en la sala.", 404);
        }

        $playerKey = "room:{$roomId}:player:{$playerName}";
        $cards = json_decode(Redis::hget($playerKey, 'cards') ?: '[]', true);
        if (!is_array($cards)) $cards = [];

        $cardIndex = null;
        $cardType = null;
        foreach ($cards as $index => $card) {
            if (!is_array($card)) continue;
            if (($card['id'] ?? null) === $cardId) {
                $cardIndex = $index;
                $cardType = $card['type'] ?? null;
                break;
            }
        }

        if ($cardIndex === null) {
            throw new GameException(GameException::CARD_NOT_IN_HAND, "No tienes esa carta en tu mano.", 422);
        }

        if ($cardType === 1) {
            $alreadyAttacked = (int) (Redis::hget($playerKey, 'attack_used_this_turn') ?? 0);
            if ($alreadyAttacked === 1) {
                throw new GameException(GameException::INVALID_ACTION, "Ya has usado una carta de ataque en este turno.", 422);
            }
            if ($playerName === $targetName) {
                throw new GameException(GameException::INVALID_TARGET, "No puedes atacarte a ti mismo.", 422);
            }
        }

        // Consumir carta
        array_splice($cards, $cardIndex, 1);
        Redis::hset($playerKey, 'cards', json_encode($cards));

        $targetKey = "room:{$roomId}:player:{$targetName}";

        // -- Carta de ataque --
        if ($cardType === 1) {
            $targetCards = json_decode(Redis::hget($targetKey, 'cards') ?: '[]', true);
            $hasDodge = !empty(array_filter($targetCards, fn($c) => is_array($c) && ($c['type'] ?? null) === 3));

            Redis::hset($playerKey, 'attack_used_this_turn', 1);

            if ($hasDodge) {
                Redis::hmset("room:{$roomId}:pending_attack", [
                    'attacker' => $playerName,
                    'target'   => $targetName,
                ]);
            } else {
                Redis::hincrby($targetKey, 'stress', 1);
            }
            // -- Carta de curación --
        } elseif ($cardType === 2) {
            $currentStress = (int) (Redis::hget($playerKey, 'stress') ?? 0);
            if ($currentStress > 0) {
                Redis::hincrby($playerKey, 'stress', -1);
            }
            // -- Carta de robo --
        } elseif ($cardType === 4) {
            if ($playerName === $targetName) {
                throw new GameException(GameException::INVALID_TARGET, "No puedes robarte a ti mismo.", 422);
            }

            $targetCards = json_decode(Redis::hget($targetKey, 'cards') ?: '[]', true);
            if (!is_array($targetCards)) $targetCards = [];

            if (empty($targetCards)) {
                throw new GameException(GameException::INVALID_TARGET, "El objetivo no tiene cartas.", 422);
            }

            // Robar carta aleatoria
            $randomIndex = array_rand($targetCards);
            $stolenCard = $targetCards[$randomIndex];
            array_splice($targetCards, $randomIndex, 1);

            // Actualizar mano del objetivo
            Redis::hset($targetKey, 'cards', json_encode($targetCards));

            // Añadir carta robada al ladrón
            $myCards = json_decode(Redis::hget($playerKey, 'cards') ?: '[]', true);
            if (!is_array($myCards)) $myCards = [];
            $myCards[] = $stolenCard;
            Redis::hset($playerKey, 'cards', json_encode($myCards));
        }

        event(new RoomStateUpdated($roomId));
    }

    public function reactToAttack(string $roomId, string $playerName, string $reaction, ?string $cardId = null): void
    {
        $pendingKey = "room:{$roomId}:pending_attack";

        if (!Redis::exists($pendingKey)) {
            throw new GameException(GameException::INVALID_ACTION, "No hay ningún ataque pendiente.", 422);
        }

        $pending = Redis::hgetall($pendingKey);
        if (($pending['target'] ?? null) !== $playerName) {
            throw new GameException(GameException::INVALID_ACTION, "No eres el objetivo de este ataque.", 403);
        }

        $targetKey = "room:{$roomId}:player:{$playerName}";

        if ($reaction === 'dodge') {
            if (!$cardId) {
                throw new GameException(GameException::CARD_NOT_IN_HAND, "No se ha indicado la carta de esquive.", 422);
            }

            $cards = json_decode(Redis::hget($targetKey, 'cards') ?: '[]', true);
            if (!is_array($cards)) $cards = [];

            $cardIndex = null;
            foreach ($cards as $index => $card) {
                if (!is_array($card)) continue;
                if (($card['id'] ?? null) === $cardId && ($card['type'] ?? null) === 3) {
                    $cardIndex = $index;
                    break;
                }
            }

            if ($cardIndex === null) {
                throw new GameException(GameException::CARD_NOT_IN_HAND, "No tienes una carta de esquive válida.", 422);
            }

            array_splice($cards, $cardIndex, 1);
            Redis::hset($targetKey, 'cards', json_encode($cards));
            Redis::del($pendingKey);
        } elseif ($reaction === 'accept') {
            Redis::hincrby($targetKey, 'stress', 1);
            Redis::del($pendingKey);
        } else {
            throw new GameException(GameException::INVALID_ACTION, "Reacción no válida.", 422);
        }

        event(new RoomStateUpdated($roomId));
    }
}
