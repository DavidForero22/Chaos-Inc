<?php
// app/Services/LiveGame/LiveGameService.php

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
        protected DisconnectionService $disconnectionService,
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
        $playersCount = count($players);

        if ($playersCount < 3) {
            throw new RoomException(RoomException::NOT_ENOUGH_PLAYERS, "There are not enough players (at least 3).", 409);
        }

        $this->initializeRoomState($roomKey, $players);

        $roles = $this->generateRolesDistribution($playersCount);
        $deck = $this->deckService->buildDeck();
        $bossPlayerName = $this->assignRolesAndCards($roomId, $players, $roles, $deck);

        $this->finalizeGameSetup($roomId, $bossPlayerName, $deck, $players);

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

        $this->disconnectionService->checkBossGracePeriod($roomId);

        $myData = Redis::hgetall($playerKey);
        $pendingAttack = Redis::hgetall("room:{$roomId}:pending_attack");

        return [
            'me' => $this->formatMyData($playerName, $myData, $pendingAttack),
            'game' => $this->formatGameData($roomId, $room, $playerName)
        ];
    }

    // =========================================================================
    // DELEGACIONES
    // =========================================================================

    public function endTurn(string $roomId, string $playerName): void
    {
        $this->turnService->endTurn($roomId, $playerName);
    }

    public function checkAndAdvanceTurnOnDisconnect(string $roomId, string $disconnectedPlayer): void
    {
        $this->turnService->checkAndAdvanceTurnOnDisconnect($roomId, $disconnectedPlayer);
    }

    public function playAction(string $roomId, string $playerName, string $cardId, string $targetName): void
    {
        $this->gameActionService->playAction($roomId, $playerName, $cardId, $targetName);
    }

    public function reactToAttack(string $roomId, string $playerName, string $reaction, ?string $cardId = null): void
    {
        $this->gameActionService->reactToAttack($roomId, $playerName, $reaction, $cardId);
    }

    // =========================================================================
    // MÉTODOS PRIVADOS
    // =========================================================================

    private function initializeRoomState(string $roomKey, array &$players): void
    {
        Redis::hset($roomKey, 'status', 'in_game');
        Redis::hset($roomKey, 'game_over', 0);
        Redis::hset($roomKey, 'winner_role', '');
        Redis::hset($roomKey, 'round_number', 1);
        shuffle($players);
    }

    private function generateRolesDistribution(int $count): array
    {
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

        return $roles;
    }

    private function assignRolesAndCards(string $roomId, array $players, array $roles, array &$deck): string
    {
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
                'acting_boss'           => 0,
            ]);
            Redis::expire("room:{$roomId}:player:{$playerName}", 86400);
        }

        return $bossPlayerName;
    }

    private function finalizeGameSetup(string $roomId, string $bossPlayerName, array $deck, array $players): void
    {
        Redis::hset("room:{$roomId}", 'current_turn_player_id', $bossPlayerName);
        Redis::setex("room:{$roomId}:turn_order", 86400, json_encode($players));
        Redis::setex("room:{$roomId}:deck", 86400, json_encode($deck));

        if ($bossPlayerName !== '') {
            $this->deckService->drawCardsForPlayer($roomId, $bossPlayerName, 2);
        }
    }

    private function formatMyData(string $playerName, array $myData, array $pendingAttack): array
    {
        $hasIncomingAttack = !empty($pendingAttack) && ($pendingAttack['target'] ?? null) === $playerName;
        $hasPendingAttack  = !empty($pendingAttack) && ($pendingAttack['attacker'] ?? null) === $playerName;

        return [
            'name'                  => $playerName,
            'role'                  => $myData['role'],
            'stress'                => (int) $myData['stress'],
            'is_dead'               => $this->toBool($myData['is_dead'] ?? 0),
            'cards'                 => json_decode($myData['cards'] ?? '[]'),
            'is_online'             => $this->toBool($myData['is_online'] ?? 1),
            'skip_next_turn'        => $this->toBool($myData['skip_next_turn'] ?? 0),
            'attack_used_this_turn' => $this->toBool($myData['attack_used_this_turn'] ?? 0),
            'incoming_attack'       => $hasIncomingAttack,
            'has_pending_attack'    => $hasPendingAttack,
            'has_shield'            => $this->toBool($myData['has_shield'] ?? 0),
            'acting_boss'           => $this->toBool($myData['acting_boss'] ?? 0),
        ];
    }

    private function formatGameData(string $roomId, array $room, string $myPlayerName): array
    {
        $opponents = [];
        foreach (Redis::smembers("room:{$roomId}:players") as $pName) {
            if ($pName === $myPlayerName) continue;

            $pData = Redis::hgetall("room:{$roomId}:player:{$pName}");
            $opponents[] = [
                'name'        => $pName,
                'stress'      => (int) ($pData['stress'] ?? 0),
                'is_dead'     => $this->toBool($pData['is_dead'] ?? 0),
                'role'        => ($pData['role'] === 'boss') ? 'boss' : 'hidden',
                'is_online'   => $this->toBool($pData['is_online'] ?? 1),
                'cards_count' => count(json_decode($pData['cards'] ?? '[]', true) ?: []),
                'has_shield'  => $this->toBool($pData['has_shield'] ?? 0),
            ];
        }

        return [
            'current_turn'      => $room['current_turn_player_id'] ?? null,
            'opponents'         => $opponents,
            'game_over'         => $this->toBool($room['game_over'] ?? 0),
            'winner_role'       => $room['winner_role'] ?? null,
            'round_number'      => (int) ($room['round_number'] ?? 0),
            'deck_count'        => count(json_decode(Redis::get("room:{$roomId}:deck") ?? '[]', true)),
            'boss_disconnected' => Redis::exists("room:{$roomId}:boss_grace_period") || $this->hasBossOfflineWithActingBoss($roomId),
        ];
    }

    private function hasBossOfflineWithActingBoss(string $roomId): bool
    {
        foreach (Redis::smembers("room:{$roomId}:players") as $name) {
            $pData = Redis::hgetall("room:{$roomId}:player:{$name}");
            if (($pData['role'] ?? '') === 'boss' && ($pData['is_online'] ?? '1') === '0') {
                return true;
            }
        }
        return false;
    }

    private function toBool($value): bool
    {
        return filter_var($value, FILTER_VALIDATE_BOOLEAN);
    }
}
