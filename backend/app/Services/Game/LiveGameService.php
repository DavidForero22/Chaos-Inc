<?php
// app/Services/Game/LiveGameService.php

namespace App\Services\Game;

use App\Events\GameStarted;
use App\Events\RoomListUpdated;
use App\Events\RoomStateUpdated;
use App\Exceptions\GameException;
use App\Exceptions\RoomException;
use App\Http\Resources\GameDataResource;
use App\Http\Resources\MyDataResource;
use App\Services\Game\Actions\GameActionService;
use App\Services\Game\Engine\DeckService;
use App\Services\Game\Engine\TurnService;
use App\Services\Game\Status\DisconnectionService;
use Illuminate\Support\Facades\Redis;
use App\Support\LiveGameHelper;

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

        $roles = LiveGameHelper::generateRolesDistribution($playersCount);
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
        $pendingMultiAttack = json_decode(Redis::get("room:{$roomId}:pending_multi_attack") ?? 'null', true);

        return [
            'me'   => new MyDataResource([
                'playerName'    => $playerName,
                'myData'        => $myData,
                'pendingAttack' => $pendingAttack,
                'pendingMultiAttack' => $pendingMultiAttack,
                'roomId'        => $roomId,
            ]),
            'game' => new GameDataResource([
                'roomId'       => $roomId,
                'room'         => $room,
                'myPlayerName' => $playerName,
            ])
        ];
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
}
