<?php
// app/Services/Game/Engine/TurnService.php

namespace App\Services\Game\Engine;

use App\Events\RoomStateUpdated;
use App\Exceptions\GameException;
use App\Exceptions\RoomException;
use App\Services\Game\Status\GameFinalizationService;
use Illuminate\Support\Facades\Redis;

class TurnService
{
    public function __construct(protected DeckService $deckService) {}

    public function advanceTurn(string $roomId): void
    {
        $roomKey = "room:{$roomId}";
        $turnOrderStr = Redis::get("{$roomKey}:turn_order");

        if (!$turnOrderStr) return;

        $turnOrder = json_decode($turnOrderStr, true);
        $currentTurn = Redis::hget($roomKey, 'current_turn_player_id');

        $currentIndex = array_search($currentTurn, $turnOrder);
        if ($currentIndex === false) $currentIndex = 0;

        $totalPlayers = count($turnOrder);
        $nextIndex = $currentIndex;

        $hasWrapped = false;

        for ($i = 0; $i < $totalPlayers; $i++) {
            $nextIndex = ($nextIndex + 1) % $totalPlayers;
            $nextPlayer = $turnOrder[$nextIndex];

            if ($nextIndex === 0) {
                $hasWrapped = true;
            }

            $playerKey = "{$roomKey}:player:{$nextPlayer}";

            $isOnline = Redis::hget($playerKey, 'is_online') !== '0';
            $isDead   = Redis::hget($playerKey, 'is_dead') === '1';
            $skipNext = Redis::hget($playerKey, 'skip_next_turn') === '1';

            if ($skipNext) {
                Redis::hset($playerKey, 'skip_next_turn', 0);
                continue;
            }

            if ($isOnline && !$isDead) {
                Redis::hset($roomKey, 'current_turn_player_id', $nextPlayer);
                $this->deckService->drawCardsForPlayer($roomId, $nextPlayer, 2);

                if ($hasWrapped) {
                    Redis::hincrby($roomKey, 'round_number', 1);
                }

                // Si el siguiente jugador está bloqueado, crear el minijuego
                $isBlocked = Redis::hget($playerKey, 'is_blocked') === '1';
                if ($isBlocked) {
                    Redis::hset($playerKey, 'is_blocked', 0);
                    $colors = ['red', 'blue', 'green', 'yellow'];
                    $correct = $colors[array_rand($colors)];
                    Redis::setex("room:{$roomId}:luck_challenge:{$nextPlayer}", 60, $correct);
                }

                break;
            }
        }
    }

    public function checkAndAdvanceTurnOnDisconnect(string $roomId, string $disconnectedPlayer): void
    {
        $currentTurn = Redis::hget("room:{$roomId}", 'current_turn_player_id');

        if ($currentTurn === $disconnectedPlayer) {
            $this->advanceTurn($roomId);
        }
    }

    public function endTurn(string $roomId, string $playerName): void
    {
        $roomKey = "room:{$roomId}";

        if (!Redis::exists($roomKey)) {
            throw new RoomException(RoomException::ROOM_NOT_FOUND, "The room does not exist.", 404);
        }

        $currentTurn = Redis::hget($roomKey, 'current_turn_player_id');
        if ($currentTurn !== $playerName) {
            throw new GameException(GameException::NOT_YOUR_TURN, "No es tu turno.", 403);
        }

        if (app(GameFinalizationService::class)->isGameEffectivelyOver($roomId)) {
            throw new GameException(
                GameException::CANNOT_SKIP_DURING_ENDING,
                "No puedes saltar turno mientras la partida está a punto de finalizar.",
                422
            );
        }

        if (Redis::exists("room:{$roomId}:pending_attack")) {
            throw new GameException(GameException::INVALID_ACTION, "Hay un ataque pendiente de resolver.", 422);
        }

        Redis::hset("room:{$roomId}:player:{$playerName}", 'single_attack_used_this_turn', 0);
        Redis::hset("room:{$roomId}:player:{$playerName}", 'multi_attack_used_this_turn', 0);

        $this->advanceTurn($roomId);
        event(new RoomStateUpdated($roomId));
    }
}
