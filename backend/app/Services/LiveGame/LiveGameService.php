<?php

namespace App\Services\LiveGame;

use App\Events\GameStarted;
use App\Events\RoomListUpdated;
use App\Events\RoomStateUpdated;
use App\Exceptions\GameException;
use App\Exceptions\RoomException;
use Illuminate\Support\Facades\Redis;

class LiveGameService
{
    public function __construct(
        protected DeckService $deckService,
        protected TurnService $turnService,
        protected GameActionService $gameActionService,
    ) {}

    public function startGame(string $roomId, string $requestingPlayer): void
    {
        $roomKey = "room:{$roomId}";

        if (!Redis::exists($roomKey)) {
            throw new RoomException(RoomException::ROOM_NOT_FOUND, "The room does not exist.", 404);
        }

        $room = Redis::hgetall($roomKey);

        if ($room['owner_name'] !== $requestingPlayer) {
            throw new RoomException(RoomException::NOT_LEADER, "Only the leader can start the game.", 403);
        }

        $players = Redis::smembers("{$roomKey}:players");
        if (count($players) < 3) {
            throw new RoomException(RoomException::NOT_ENOUGH_PLAYERS, "There are not enough players (at least 3).", 409);
        }

        Redis::hset($roomKey, 'status', 'in_game');
        Redis::hset($roomKey, 'game_over', 0);
        Redis::hset($roomKey, 'winner_role', '');
        Redis::hset($roomKey, 'round_number', 0);

        shuffle($players);
        $count = count($players);

        // Tabla de balanceo de roles según número de jugadores
        $roleTable = [
            3 => ['boss' => 1, 'secretary' => 0, 'intern' => 1, 'union' => 1],
            4 => ['boss' => 1, 'secretary' => 1, 'intern' => 1, 'union' => 1],
            5 => ['boss' => 1, 'secretary' => 1, 'intern' => 1, 'union' => 2],
            6 => ['boss' => 1, 'secretary' => 1, 'intern' => 1, 'union' => 3],
        ];

        $distribution = $roleTable[$count] ?? $roleTable[6];

        $roles = [];
        foreach ($distribution as $role => $amount) {
            for ($i = 0; $i < $amount; $i++) {
                $roles[] = $role;
            }
        }

        $deck = $this->deckService->buildDeck();
        $bossPlayerName = '';

        foreach ($players as $index => $playerName) {
            $playerRole = $roles[$index];
            if ($playerRole === 'boss') $bossPlayerName = $playerName;

            $playerCards = array_splice($deck, 0, 3);

            Redis::hmset("room:{$roomId}:player:{$playerName}", [
                'role'                  => $playerRole,
                'stress'                => 0,
                'is_dead'               => 0,
                'cards'                 => json_encode($playerCards),
                'is_online'             => 1,
                'skip_next_turn'        => 0,
                'attack_used_this_turn' => 0,
                'has_shield'            => 0,
                'damage_dealt'          => 0,
                'damage_received'       => 0,
                'cards_played'          => 0,
                'eliminations'          => 0,
            ]);
            Redis::expire("room:{$roomId}:player:{$playerName}", 86400);
        }

        Redis::hset($roomKey, 'current_turn_player_id', $bossPlayerName);
        Redis::set("room:{$roomId}:turn_order", json_encode($players));
        Redis::expire("room:{$roomId}:turn_order", 86400);
        Redis::set("room:{$roomId}:deck", json_encode($deck));
        Redis::expire("room:{$roomId}:deck", 86400);

        if ($bossPlayerName !== '') {
            $this->deckService->drawCardsForPlayer($roomId, $bossPlayerName, 2);
        }

        event(new RoomListUpdated($roomId));
        event(new RoomStateUpdated($roomId));
        event(new GameStarted($roomId));
    }

    public function getPlayerData(string $roomId, string $playerName): array
    {
        $roomKey = "room:{$roomId}";

        if (!Redis::exists($roomKey)) {
            throw new RoomException(RoomException::ROOM_NOT_FOUND, "The room does not exist.", 404);
        }

        $room = Redis::hgetall($roomKey);

        if (($room['status'] ?? 'waiting') === 'waiting') {
            throw new GameException(GameException::GAME_NOT_STARTED, "The game has not started yet.", 400);
        }

        $playerKey = "room:{$roomId}:player:{$playerName}";

        if (!Redis::exists($playerKey)) {
            throw new RoomException(RoomException::PLAYER_NOT_FOUND, "Player data not found.", 404);
        }

        $myData = Redis::hgetall($playerKey);
        $pendingAttack = Redis::hgetall("room:{$roomId}:pending_attack");
        $hasIncomingAttack = !empty($pendingAttack) && ($pendingAttack['target'] ?? null) === $playerName;
        $hasPendingAttack  = !empty($pendingAttack) && ($pendingAttack['attacker'] ?? null) === $playerName;

        $opponents = [];
        foreach (Redis::smembers("room:{$roomId}:players") as $pName) {
            if ($pName === $playerName) continue;

            $pData = Redis::hgetall("room:{$roomId}:player:{$pName}");
            $opponents[] = [
                'name'        => $pName,
                'stress'      => (int) ($pData['stress'] ?? 0),
                'is_dead'     => (bool) filter_var($pData['is_dead'] ?? false, FILTER_VALIDATE_BOOLEAN),
                'role'        => ($pData['role'] === 'boss') ? 'boss' : 'hidden',
                'is_online'   => (bool) filter_var($pData['is_online'] ?? true, FILTER_VALIDATE_BOOLEAN),
                'cards_count' => count(json_decode($pData['cards'] ?? '[]', true) ?: []),
                'has_shield'  => (bool) filter_var($pData['has_shield'] ?? false, FILTER_VALIDATE_BOOLEAN), // ← nuevo
            ];
        }

        return [
            'me' => [
                'name'                  => $playerName,
                'role'                  => $myData['role'],
                'stress'                => (int) $myData['stress'],
                'is_dead'               => (bool) $myData['is_dead'],
                'cards'                 => json_decode($myData['cards']),
                'is_online'             => (bool) filter_var($myData['is_online'] ?? true, FILTER_VALIDATE_BOOLEAN),
                'skip_next_turn'        => (bool) filter_var($myData['skip_next_turn'] ?? false, FILTER_VALIDATE_BOOLEAN),
                'attack_used_this_turn' => (bool) filter_var($myData['attack_used_this_turn'] ?? false, FILTER_VALIDATE_BOOLEAN),
                'incoming_attack'       => $hasIncomingAttack,
                'has_pending_attack' => $hasPendingAttack,
                'has_shield'            => (bool) filter_var($myData['has_shield'] ?? false, FILTER_VALIDATE_BOOLEAN),

            ],
            'game' => [
                'current_turn' => $room['current_turn_player_id'] ?? null,
                'opponents'    => $opponents,
                'game_over'    => (bool) filter_var($room['game_over'] ?? false, FILTER_VALIDATE_BOOLEAN),
                'winner_role'  => $room['winner_role'] ?? null,
            ]
        ];
    }

    // Delegaciones al TurnService
    public function endTurn(string $roomId, string $playerName): void
    {
        $this->turnService->endTurn($roomId, $playerName);
    }

    public function checkAndAdvanceTurnOnDisconnect(string $roomId, string $disconnectedPlayer): void
    {
        $this->turnService->checkAndAdvanceTurnOnDisconnect($roomId, $disconnectedPlayer);
    }

    // Delegaciones al GameActionService
    public function playAction(string $roomId, string $playerName, string $cardId, string $targetName): void
    {
        $this->gameActionService->playAction($roomId, $playerName, $cardId, $targetName);
    }

    public function reactToAttack(string $roomId, string $playerName, string $reaction, ?string $cardId = null): void
    {
        $this->gameActionService->reactToAttack($roomId, $playerName, $reaction, $cardId);
    }
}
