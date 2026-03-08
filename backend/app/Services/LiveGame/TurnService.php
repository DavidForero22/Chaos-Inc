<?php

namespace App\Services\LiveGame;

use App\Events\RoomStateUpdated;
use App\Exceptions\GameException;
use App\Exceptions\RoomException;
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

        for ($i = 0; $i < $totalPlayers; $i++) {
            $nextIndex = ($nextIndex + 1) % $totalPlayers;
            $nextPlayer = $turnOrder[$nextIndex];
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

        if (Redis::exists("room:{$roomId}:pending_attack")) {
            throw new GameException(GameException::INVALID_ACTION, "Hay un ataque pendiente de resolver.", 422);
        }

        Redis::hset("room:{$roomId}:player:{$playerName}", 'attack_used_this_turn', 0);
        Redis::hincrby("room:{$roomId}", 'round_number', 1);

        $this->advanceTurn($roomId);
        event(new RoomStateUpdated($roomId));
    }
}
