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
use App\Models\UserDiscoveredCard;
use App\Services\Game\Actions\GameActionService;
use App\Services\Game\Engine\DeckService;
use App\Services\Game\Engine\TurnService;
use App\Services\Game\Status\DisconnectionService;
use Illuminate\Support\Facades\Redis;
use App\Support\LiveGameHelper;
use App\Support\RoomLogger;

class LiveGameService
{
    public function __construct(
        protected DeckService $deckService,
        protected TurnService $turnService,
        protected GameActionService $gameActionService,
        protected DisconnectionService $disconnectionService,
    ) {}

    public function startGame(string $roomId, string $requestingPlayerId): void
    {
        $roomInfoKey = "room:{$roomId}:info";

        if (!Redis::exists($roomInfoKey)) {
            throw new RoomException(RoomException::ROOM_NOT_FOUND, "La sala no existe.", 404);
        }

        $ownerId = Redis::hget($roomInfoKey, 'owner_id');

        if ($ownerId !== $requestingPlayerId) {
            throw new RoomException(RoomException::NOT_LEADER, "Solo el líder puede iniciar la partida.", 403);
        }

        $playerIds  = Redis::smembers("room:{$roomId}:players");
        $playersCount = count($playerIds);

        // Se requieren al menos 3 jugadores siempre
        if ($playersCount < 3) {
            throw new RoomException(
                RoomException::NOT_ENOUGH_PLAYERS,
                "No hay suficientes jugadores (mínimo 3).",
                409
            );
        }

        // Ghost IDs no existen en la BD; whereIn los ignora de forma segura
        $users = User::whereIn('id', $playerIds)->get()->keyBy('id');

        $this->initializeRoomState($roomId, $playerIds);

        // Los roles se generan de forma normal siempre
        $roles = LiveGameHelper::generateRolesDistribution($playersCount);
        $deck  = $this->deckService->buildDeck();

        $currentTurnPlayerId = $this->assignRolesAndCards(
            $roomId,
            $playerIds,
            $roles,
            $deck,
            $users
        );

        $this->finalizeGameSetup($roomId, $currentTurnPlayerId, $deck, $playerIds);

        event(new RoomListUpdated($roomId));
        event(new RoomStateUpdated($roomId));
        event(new GameStarted($roomId));
    }

    public function getPlayerData(string $roomId, string $playerId): array
    {
        $roomStateKey = "room:{$roomId}:state";

        if (!Redis::exists($roomStateKey)) {
            throw new RoomException(RoomException::ROOM_NOT_FOUND, "La sala no existe.", 404);
        }

        $status = Redis::hget($roomStateKey, 'status');

        if (($status ?? 'waiting') === 'waiting') {
            throw new GameException(GameException::GAME_NOT_STARTED, "La partida no ha empezado todavia.", 400);
        }

        $playerInfoKey = "room:{$roomId}:player:{$playerId}:info";

        if (!Redis::exists($playerInfoKey)) {
            throw new RoomException(RoomException::PLAYER_NOT_FOUND, "Datos del jugador no encontrados.", 404);
        }

        $playerName = Redis::hget($playerInfoKey, 'username') ?? "ID_{$playerId}";

        $this->disconnectionService->checkBossGracePeriod($roomId);

        $myDataInfo  = Redis::hgetall($playerInfoKey);
        $myDataStats = Redis::hgetall("room:{$roomId}:player:{$playerId}:stats");
        $myDataTurn  = Redis::hgetall("room:{$roomId}:player:{$playerId}:turn_state");
        $myDataPerks = Redis::hgetall("room:{$roomId}:player:{$playerId}:perks");
        $myDataHand  = Redis::get("room:{$roomId}:player:{$playerId}:hand") ?: '[]';

        $myData = array_merge($myDataInfo, $myDataStats, $myDataTurn, $myDataPerks);

        $myData['username'] = $playerName;
        $myData['user_id'] = $playerId;
        $myData['cards'] = $myDataHand;

        $pendingAttack = Redis::hgetall("room:{$roomId}:pending_attack");
        $pendingMultiAttack = json_decode(
            Redis::get("room:{$roomId}:pending_multi_attack") ?? 'null',
            true
        );

        return [
            'me'   => new MyDataResource([
                'playerId'           => $playerId,
                'playerName'         => $playerName,
                'myData'             => $myData,
                'pendingAttack'      => $pendingAttack,
                'pendingMultiAttack' => $pendingMultiAttack,
                'roomId'             => $roomId,
            ]),
            'game' => new GameDataResource([
                'roomId'       => $roomId,
                'myPlayerId'   => (int) $playerId,
                'myPlayerName' => $playerName,
            ])
        ];
    }

    // =========================================================================
    // MÉTODOS PRIVADOS
    // =========================================================================

    private function initializeRoomState(string $roomId, array &$playerIds): void
    {
        $roomStateKey = "room:{$roomId}:state";

        Redis::hset($roomStateKey, 'status', 'in_game');
        Redis::hset($roomStateKey, 'game_over', 0);
        Redis::hset($roomStateKey, 'winner_role', '');
        Redis::hset($roomStateKey, 'round_number', 1);

        shuffle($playerIds);
    }

    private function assignRolesAndCards(
        string $roomId,
        array $playerIds,
        array $roles,
        array &$deck,
        $users
    ): string {

        $currentTurnPlayerId = '';

        foreach ($playerIds as $index => $playerId) {
            $user = $users->firstWhere('id', (int) $playerId);
            $playerRole = $roles[$index];

            if ($playerRole === 'boss') {
                $currentTurnPlayerId = $playerId;
            }

            $playerCards = array_splice($deck, 0, 3);
            $baseKey     = "room:{$roomId}:player:{$playerId}";

            // ---- 1. Info del jugador ----
            Redis::hmset("{$baseKey}:info", [
                'user_id'     => $playerId,
                'username'    => $user?->username ?? '',
                'role'        => $playerRole,
                'stress'      => 0,
                'acting_boss' => 0,
                'is_online'   => 1,
                'is_dead'     => 0,
                'killer_name' => null,
                'is_guest'    => $user ? ($user->is_guest ? 1 : 0) : 1,
            ]);

            // ---- 2. Estadísticas ----
            Redis::hmset("{$baseKey}:stats", [
                'damage_dealt'          => 0,
                'damage_received'       => 0,
                'healing_done'          => 0,
                'cards_played'          => 0,
                'passives_played'       => 0,
                'eliminations'          => 0,
                'dodged_attacks'        => 0,
                'cards_stolen'          => 0,
                'passive_equipped'      => 0,
                'luck_streak'           => 0,
                'dodged_or_defended'    => 0,
            ]);

            Redis::hmset("{$baseKey}:turn_state", [
                'skip_next_turn'               => 0,
                'single_attack_used_this_turn' => 0,
                'multi_attack_used_this_turn'  => 0,
                'must_discard'                 => 0,
            ]);

            Redis::hmset("{$baseKey}:perks", [
                'has_shield'            => 0,
                'has_storage'           => 0,
                'has_luck'              => 0,
                'has_distance'          => 0,
                'is_blocked'            => 0,
                'vision_bonus'          => 0,
                'has_potato_launcher'   => 0,
            ]);

            // ---- 3. Inicializar sets de descubrimiento ----
            $knownKey = "room:{$roomId}:player:{$playerId}:known_cards";
            $newKey   = "room:{$roomId}:player:{$playerId}:new_cards";

            // Si NO es invitado, cargar desde BD las cartas ya descubiertas
            $isGuest = $user ? $user->is_guest : true;
            if (!$isGuest && $user) {
                $discovered = UserDiscoveredCard::where('user_id', $user->id)
                    ->pluck('card_id')
                    ->map(fn($id) => (string) $id)
                    ->toArray();
                if (!empty($discovered)) {
                    Redis::sadd($knownKey, ...$discovered);
                }
            }

            // Añadir las 3 cartas iniciales a new_cards si no estaban en known_cards
            foreach ($playerCards as $card) {
                $cardBaseId = (string) $card['card_id'];
                if (!Redis::sismember($knownKey, $cardBaseId)) {
                    Redis::sadd($newKey, $cardBaseId);
                }
            }
            // ---- 4. Guardar mano ----
            $this->deckService->initialDeal($roomId, $playerId, $playerCards);
            Redis::hmset("{$baseKey}:card_usage", ['initialized' => 1]);

            // ---- 5. Expiración (TTL 24h) ----
            Redis::expire("{$baseKey}:info", 86400);
            Redis::expire("{$baseKey}:stats", 86400);
            Redis::expire("{$baseKey}:turn_state", 86400);
            Redis::expire("{$baseKey}:perks", 86400);
            Redis::expire("{$baseKey}:hand", 86400);
            Redis::expire("{$baseKey}:card_usage", 86400);
        }

        return $currentTurnPlayerId;
    }

    private function finalizeGameSetup(
        string $roomId,
        string $bossPlayerId,
        array $deck,
        array $playerIds
    ): void {
        $roomInfoKey  = "room:{$roomId}:info";
        $roomStateKey = "room:{$roomId}:state";

        $timeout = (int) (Redis::hget($roomInfoKey, 'turn_timeout') ?: 30);
        $expireAt = now('UTC')->addSeconds($timeout);
        $turnId  = uniqid('turn_', true);

        Redis::hset($roomStateKey, 'current_turn_player_id', $bossPlayerId);
        Redis::hset($roomStateKey, 'current_turn_id', $turnId);

        Redis::hset($roomStateKey, 'turn_expires_at', $expireAt->timestamp);

        Redis::setex(
            "room:{$roomId}:turn_order",
            86400,
            json_encode($playerIds)
        );

        Redis::setex(
            "room:{$roomId}:deck",
            86400,
            json_encode($deck)
        );

        RoomLogger::info($roomId, "LiveGameService.php::finalizeGameSetup - Iniciando temporizador para jugador {$bossPlayerId} para las {$expireAt}");

        // El Job le da 3 segundos de gracia para tolerar latencia.
        AutoEndTurnJob::dispatch(
            $roomId,
            $bossPlayerId,
            $turnId
        )->delay((clone $expireAt)->addSeconds(3));

        if ($bossPlayerId !== '') {
            $this->deckService->drawCardsForPlayer($roomId, $bossPlayerId, 2);
        }
    }
}
