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
use App\Jobs\AutoEndTurnJob;
use App\Models\User;
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
        $roomInfoKey = "room:{$roomId}:info";

        if (!Redis::exists($roomInfoKey)) {
            throw new RoomException(RoomException::ROOM_NOT_FOUND, "The room does not exist.", 404);
        }

        $ownerName = Redis::hget($roomInfoKey, 'owner_name');

        if ($ownerName !== $requestingPlayer) {
            throw new RoomException(RoomException::NOT_LEADER, "Only the leader can start the game.", 403);
        }

        $players = Redis::smembers("room:{$roomId}:players");
        $playersCount = count($players);

        if ($playersCount < 3) {
            throw new RoomException(RoomException::NOT_ENOUGH_PLAYERS, "There are not enough players (at least 3).", 409);
        }

        // Obtener IDs de la BD indexados por username
        $playerIds = User::whereIn('username', $players)
            ->pluck('id', 'username')
            ->toArray();

        $this->initializeRoomState($roomId, $players);

        $roles = LiveGameHelper::generateRolesDistribution($playersCount);
        $deck = $this->deckService->buildDeck();
        $bossPlayerName = $this->assignRolesAndCards($roomId, $players, $roles, $deck, $playerIds);

        $this->finalizeGameSetup($roomId, $bossPlayerName, $deck, $players);

        event(new RoomListUpdated($roomId));
        event(new RoomStateUpdated($roomId));
        event(new GameStarted($roomId));
    }

    public function getPlayerData(string $roomId, string $playerName): array
    {
        $roomStateKey = "room:{$roomId}:state";

        if (!Redis::exists($roomStateKey)) {
            throw new RoomException(RoomException::ROOM_NOT_FOUND, "The room does not exist.", 404);
        }

        $status = Redis::hget($roomStateKey, 'status');

        if (($status ?? 'waiting') === 'waiting') {
            throw new GameException(GameException::GAME_NOT_STARTED, "The game has not started yet.", 400);
        }

        $playerInfoKey = "room:{$roomId}:player:{$playerName}:info";

        if (!Redis::exists($playerInfoKey)) {
            throw new RoomException(RoomException::PLAYER_NOT_FOUND, "Player data not found.", 404);
        }

        $this->disconnectionService->checkBossGracePeriod($roomId);

        $myDataInfo  = Redis::hgetall($playerInfoKey);
        $myDataStats = Redis::hgetall("room:{$roomId}:player:{$playerName}:stats");
        $myDataTurn  = Redis::hgetall("room:{$roomId}:player:{$playerName}:turn_state");
        $myDataPerks = Redis::hgetall("room:{$roomId}:player:{$playerName}:perks");
        $myDataHand  = Redis::get("room:{$roomId}:player:{$playerName}:hand") ?: '[]';

        $myData = array_merge($myDataInfo, $myDataStats, $myDataTurn, $myDataPerks);
        $myData['cards'] = $myDataHand;

        $pendingAttack = Redis::hgetall("room:{$roomId}:pending_attack");
        $pendingMultiAttack = json_decode(Redis::get("room:{$roomId}:pending_multi_attack") ?? 'null', true);

        return [
            'me'   => new MyDataResource([
                'playerName'         => $playerName,
                'myData'             => $myData,
                'pendingAttack'      => $pendingAttack,
                'pendingMultiAttack' => $pendingMultiAttack,
                'roomId'             => $roomId,
            ]),
            'game' => new GameDataResource([
                'roomId'       => $roomId,
                'myPlayerName' => $playerName,
            ])
        ];
    }

    // =========================================================================
    // MÉTODOS PRIVADOS
    // =========================================================================

    private function initializeRoomState(string $roomId, array &$players): void
    {
        $roomStateKey = "room:{$roomId}:state";

        Redis::hset($roomStateKey, 'status', 'in_game');
        Redis::hset($roomStateKey, 'game_over', 0);
        Redis::hset($roomStateKey, 'winner_role', '');
        Redis::hset($roomStateKey, 'round_number', 1);

        shuffle($players);
    }

    private function assignRolesAndCards(
        string $roomId,
        array $players,
        array $roles,
        array &$deck,
        array $playerIds
    ): string {

        $bossPlayerName = '';

        foreach ($players as $index => $playerName) {
            $playerRole = $roles[$index];
            if ($playerRole === 'boss') $bossPlayerName = $playerName;

            $playerCards = array_splice($deck, 0, 3);

            $baseKey = "room:{$roomId}:player:{$playerName}";

            Redis::hmset("{$baseKey}:info", [
                'user_id'         => $playerIds[$playerName] ?? 0,
                'role'            => $playerRole,
                'stress'          => 0,
                'acting_boss'     => 0,
                'is_online'       => 1,
                'is_dead'         => 0,
            ]);

            Redis::hmset("{$baseKey}:stats", [
                'damage_dealt'    => 0,
                'damage_received' => 0,
                'healing_done'    => 0,
                'cards_played'    => 0,
                'passives_played' => 0,
                'eliminations'    => 0,
                'dodged_attacks'  => 0,
                'cards_stolen'    => 0,
            ]);

            Redis::hmset("{$baseKey}:turn_state", [
                'skip_next_turn'               => 0,
                'single_attack_used_this_turn' => 0,
                'multi_attack_used_this_turn'  => 0,
                'must_discard'                 => 0,
            ]);

            Redis::hmset("{$baseKey}:perks", [
                'has_shield'   => 0,
                'has_storage'  => 0,
                'has_luck'     => 0,
                'has_distance' => 0,
                'is_blocked'   => 0,
                'vision_bonus' => 0,
            ]);

            Redis::set("{$baseKey}:hand", json_encode($playerCards));
            Redis::hmset("{$baseKey}:card_usage", ['initialized' => 1]);

            Redis::expire("{$baseKey}:info", 86400);
            Redis::expire("{$baseKey}:stats", 86400);
            Redis::expire("{$baseKey}:turn_state", 86400);
            Redis::expire("{$baseKey}:perks", 86400);
            Redis::expire("{$baseKey}:hand", 86400);
            Redis::expire("{$baseKey}:card_usage", 86400);
        }

        return $bossPlayerName;
    }

    private function finalizeGameSetup(string $roomId, string $bossPlayerName, array $deck, array $players): void
    {
        $roomInfoKey  = "room:{$roomId}:info";
        $roomStateKey = "room:{$roomId}:state";

        $timeout = (int) (Redis::hget($roomInfoKey, 'turn_timeout') ?: 30);
        $turnId  = uniqid('turn_', true);

        Redis::hset($roomStateKey, 'current_turn_player_id', $bossPlayerName);
        Redis::hset($roomStateKey, 'current_turn_id', $turnId);

        // El frontend ve el tiempo estricto
        Redis::hset($roomStateKey, 'turn_expires_at', now()->addSeconds($timeout)->timestamp);

        Redis::setex("room:{$roomId}:turn_order", 86400, json_encode($players));
        Redis::setex("room:{$roomId}:deck", 86400, json_encode($deck));

        // El Job le da 3 segundos de gracia para tolerar latencia
        AutoEndTurnJob::dispatch($roomId, $bossPlayerName, $turnId)->delay(now()->addSeconds($timeout + 3));

        if ($bossPlayerName !== '') {
            $this->deckService->drawCardsForPlayer($roomId, $bossPlayerName, 2);
        }
    }
}
