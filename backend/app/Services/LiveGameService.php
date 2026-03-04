<?php

namespace App\Services;

use App\Events\RoomStateUpdated;
use App\Events\GameStarted;
use App\Events\RoomListUpdated;
use App\Exceptions\GameException;
use App\Exceptions\RoomException;
use Illuminate\Support\Facades\Redis;

class LiveGameService
{
    /**
     * Construye el mazo inicial a partir de la configuración de cartas.
     */
    protected function buildDeck(): array
    {
        $definitions = config('cards.cards', []);

        $deck = [];

        foreach ($definitions as $card) {
            $id = $card['id'] ?? null;
            $count = $card['count'] ?? 0;

            if ($id === null || $count <= 0) {
                continue;
            }

            for ($i = 0; $i < $count; $i++) {
                // Cada entrada del mazo es una instancia única de una carta de un tipo concreto
                $deck[] = [
                    'id' => uniqid((string) $id . '_', true),
                    'type' => $id,
                    'name' => $card['name'] ?? 'Carta',
                    'description' => $card['description'] ?? '',
                ];
            }
        }

        shuffle($deck);

        return $deck;
    }

    /**
     * Roba una cantidad de cartas del mazo y las añade a la mano del jugador.
     */
    protected function drawCardsForPlayer(string $roomId, string $playerName, int $amount): void
    {
        if ($amount <= 0) {
            return;
        }

        $deckKey = "room:{$roomId}:deck";
        $deck = json_decode(Redis::get($deckKey) ?: '[]', true);

        if (empty($deck)) {
            return;
        }

        $drawn = [];

        for ($i = 0; $i < $amount; $i++) {
            if (empty($deck)) {
                break;
            }

            $drawn[] = array_shift($deck); // cada elemento es un array ['id' => string, 'type' => int]
        }

        // Guardar el mazo actualizado
        Redis::set($deckKey, json_encode($deck));

        if (empty($drawn)) {
            return;
        }

        // Añadir las cartas robadas a la mano actual del jugador
        $playerKey = "room:{$roomId}:player:{$playerName}";
        $currentCards = json_decode(Redis::hget($playerKey, 'cards') ?: '[]', true);

        if (!is_array($currentCards)) {
            $currentCards = [];
        }

        $updatedCards = array_merge($currentCards, $drawn);

        Redis::hset($playerKey, 'cards', json_encode($updatedCards));
    }

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

        // CAMBIAR ESTADO DE LA SALA
        Redis::hset($roomKey, 'status', 'in_game');

        // REPARTO DE ROLES
        shuffle($players);
        $roles = ['boss'];
        for ($i = 1; $i < count($players); $i++) {
            $roles[] = 'employee';
        }

        $bossPlayerName = '';

        // INICIALIZAR JUGADORES EN REDIS Y ASIGNAR CARTAS
        $deck = $this->buildDeck();

        foreach ($players as $index => $playerName) {
            $playerRole = $roles[$index];
            if ($playerRole === 'boss') {
                $bossPlayerName = $playerName;
            }

            // Reparto inicial: 3 cartas por jugador
            $playerCards = array_splice($deck, 0, 3);

            $playerData = [
                'role' => $playerRole,
                'stress' => 0,
                'is_dead' => 0,
                'cards' => json_encode($playerCards),
                'is_online' => 1,
                'skip_next_turn' => 0,
                'attack_used_this_turn' => 0,
            ];

            Redis::hmset("room:{$roomId}:player:{$playerName}", $playerData);
            Redis::expire("room:{$roomId}:player:{$playerName}", 86400);
        }

        // Guardar estado global de la partida
        Redis::hset($roomKey, 'current_turn_player_id', $bossPlayerName);
        Redis::set("room:{$roomId}:turn_order", json_encode($players));
        Redis::expire("room:{$roomId}:turn_order", 86400);

        // Guardar mazo restante
        Redis::set("room:{$roomId}:deck", json_encode($deck));
        Redis::expire("room:{$roomId}:deck", 86400);

        // Cuando el jefe empieza su primer turno, roba 2 cartas adicionales
        if ($bossPlayerName !== '') {
            $this->drawCardsForPlayer($roomId, $bossPlayerName, 2);
        }

        // AVISAR A TODOS
        event(new RoomListUpdated($roomId));
        event(new RoomStateUpdated($roomId));
        event(new GameStarted($roomId));
    }

    // MÉTODO PARA EL ENDPOINT DE SINCRONIZACIÓN
    public function getPlayerData(string $roomId, string $playerName): array
    {
        $roomKey = "room:{$roomId}";

        // Comprobar que la sala existe
        if (!Redis::exists($roomKey)) {
            throw new RoomException(RoomException::ROOM_NOT_FOUND, "The room does not exist.", 404);
        }

        $room = Redis::hgetall($roomKey);

        // Comprobar que el juego realmente ha empezado
        if (($room['status'] ?? 'waiting') === 'waiting') {
            throw new GameException(GameException::GAME_NOT_STARTED, "The game has not started yet.", 400);
        }

        $playerKey = "room:{$roomId}:player:{$playerName}";

        // Comprobar que el jugador tiene datos asignados
        if (!Redis::exists($playerKey)) {
            throw new RoomException(RoomException::PLAYER_NOT_FOUND, "Player data not found.", 404);
        }

        // MIS DATOS
        $myData = Redis::hgetall($playerKey);

        // Posible ataque pendiente
        $pendingAttack = Redis::hgetall("room:{$roomId}:pending_attack");
        $hasIncomingAttack = !empty($pendingAttack) && ($pendingAttack['target'] ?? null) === $playerName;

        // DATOS GLOBALES 
        $allPlayers = Redis::smembers("room:{$roomId}:players");

        // DATOS DE LOS OPONENTES (Excluyéndome a mí)
        $opponents = [];
        foreach ($allPlayers as $pName) {
            if ($pName === $playerName) continue;

            $pData = Redis::hgetall("room:{$roomId}:player:{$pName}");
            $opponents[] = [
                'name'    => $pName,
                'stress'  => (int) ($pData['stress'] ?? 0),
                'is_dead' => (bool) filter_var($pData['is_dead'] ?? false, FILTER_VALIDATE_BOOLEAN),
                'role'    => ($pData['role'] === 'boss') ? 'boss' : 'hidden',
                'is_online' => (bool) filter_var($pData['is_online'] ?? true, FILTER_VALIDATE_BOOLEAN),
                'cards_count' => count(json_decode($pData['cards'] ?? '[]', true) ?: []),
            ];
        }

        // ESTRUCTURA DE RESPUESTA
        return [
            'me' => [
                'name'    => $playerName,
                'role'    => $myData['role'],
                'stress'  => (int) $myData['stress'],
                'is_dead' => (bool) $myData['is_dead'],
                'cards'   => json_decode($myData['cards']),
                'is_online' => (bool) filter_var($myData['is_online'] ?? true, FILTER_VALIDATE_BOOLEAN),
                'skip_next_turn' => (bool) filter_var($myData['skip_next_turn'] ?? false, FILTER_VALIDATE_BOOLEAN),
                'attack_used_this_turn' => (bool) filter_var($myData['attack_used_this_turn'] ?? false, FILTER_VALIDATE_BOOLEAN),
                'incoming_attack' => $hasIncomingAttack,
            ],
            'game' => [
                'current_turn' => $room['current_turn_player_id'] ?? null,
                'opponents'    => $opponents,
            ]
        ];
    }

    public function checkAndAdvanceTurnOnDisconnect(string $roomId, string $disconnectedPlayer): void
    {
        $roomKey = "room:{$roomId}";
        $currentTurn = Redis::hget($roomKey, 'current_turn_player_id');

        // Si el que se ha ido es el que tenía el turno, pasamos al siguiente
        if ($currentTurn === $disconnectedPlayer) {
            $this->advanceTurn($roomId);
        }
    }

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

        // Buscamos al siguiente jugador válido
        for ($i = 0; $i < $totalPlayers; $i++) {
            $nextIndex = ($nextIndex + 1) % $totalPlayers;
            $nextPlayer = $turnOrder[$nextIndex];
            $playerKey = "{$roomKey}:player:{$nextPlayer}";

            $isOnline = Redis::hget($playerKey, 'is_online') !== '0';
            $skipNext = Redis::hget($playerKey, 'skip_next_turn') === '1';

            if ($skipNext) {
                // Se cobra la penalización (limpiamos el castigo y saltamos su turno)
                Redis::hset($playerKey, 'skip_next_turn', 0);
                continue;
            }

            if ($isOnline) {
                // Hemos encontrado a un jugador válido online
                Redis::hset($roomKey, 'current_turn_player_id', $nextPlayer);

                // Al comienzo de su turno, roba 2 cartas adicionales
                $this->drawCardsForPlayer($roomId, $nextPlayer, 2);
                break;
            }
        }
    }

    public function playAction(string $roomId, string $playerName, string $cardId, string $targetName): void
    {
        $roomKey = "room:{$roomId}";

        if (!Redis::exists($roomKey)) {
            throw new RoomException(RoomException::ROOM_NOT_FOUND, "The room does not exist.", 404);
        }

        // Validar que es el turno del jugador
        $currentTurn = Redis::hget($roomKey, 'current_turn_player_id');
        if ($currentTurn !== $playerName) {
            throw new GameException(GameException::NOT_YOUR_TURN, "No es tu turno.", 403);
        }

        // No permitir nuevos ataques si hay uno pendiente
        if (Redis::exists("room:{$roomId}:pending_attack")) {
            throw new GameException(GameException::INVALID_ACTION, "Hay un ataque pendiente de resolver.", 422);
        }

        // Validar que el jugador tiene la carta en la mano
        $playerKey = "room:{$roomId}:player:{$playerName}";
        $cards = json_decode(Redis::hget($playerKey, 'cards') ?: '[]', true);

        if (!is_array($cards)) {
            $cards = [];
        }

        // Buscar la carta concreta por su identificador de instancia
        $cardIndex = null;
        $playedCard = null;
        $cardType = null;
        foreach ($cards as $index => $card) {
            if (!is_array($card)) {
                continue;
            }

            if (($card['id'] ?? null) === $cardId) {
                $cardIndex = $index;
                $playedCard = $card;
                $cardType = $playedCard['type'] ?? null;
                break;
            }
        }

        if ($cardIndex === null) {
            throw new GameException(GameException::CARD_NOT_IN_HAND, "No tienes esa carta en tu mano.", 422);
        }

        // Validar al objetivo en función del tipo de carta
        if (!Redis::sismember("{$roomKey}:players", $targetName)) {
            throw new GameException(GameException::INVALID_TARGET, "El jugador objetivo no está en la sala.", 404);
        }

        // Validar que no haya atacado antes
        $playerTurnKey = "room:{$roomId}:player:{$playerName}";
        $alreadyAttacked = (int) (Redis::hget($playerTurnKey, 'attack_used_this_turn') ?? 0);

        if ($cardType === 1 && $alreadyAttacked === 1) {
            throw new GameException(
                GameException::INVALID_ACTION,
                "Ya has usado una carta de ataque en este turno.",
                422
            );
        }

        if ($cardType === 1 && $playerName === $targetName) {
            throw new GameException(GameException::INVALID_TARGET, "No puedes atacarte a ti mismo.", 422);
        }

        // Consumir la carta jugada (el resto de la mano se mantiene)
        array_splice($cards, $cardIndex, 1);
        Redis::hset($playerKey, 'cards', json_encode($cards));

        $targetKey = "room:{$roomId}:player:{$targetName}";
        $playerKey = "room:{$roomId}:player:{$playerName}";

        if ($cardType === 1) {
            // Ataque: marcamos ataque pendiente contra el objetivo.
            // El daño se aplicará solo si el objetivo decide asumirlo.
            Redis::hmset("room:{$roomId}:pending_attack", [
                'attacker' => $playerName,
                'target' => $targetName,
            ]);
            Redis::hset($playerTurnKey, 'attack_used_this_turn', 1);
        } elseif ($cardType === 2) {
            // Curar: -1 estrés a ti mismo, sin bajar de 0
            $currentStress = (int) (Redis::hget($playerKey, 'stress') ?? 0);
            if ($currentStress > 0) {
                Redis::hincrby($playerKey, 'stress', -1);
            }
        }

        // Avisar de la acción
        event(new RoomStateUpdated($roomId));
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

        // No se puede terminar turno si hay un ataque pendiente
        if (Redis::exists("room:{$roomId}:pending_attack")) {
            throw new GameException(GameException::INVALID_ACTION, "Hay un ataque pendiente de resolver.", 422);
        }

        // Aquí puedes resetear banderas de turno (ver siguiente sección)
        Redis::hset("room:{$roomId}:player:{$playerName}", 'attack_used_this_turn', 0);

        $this->advanceTurn($roomId);
        event(new RoomStateUpdated($roomId));
    }

    public function reactToAttack(string $roomId, string $playerName, string $reaction, ?string $cardId = null): void
    {
        $pendingKey = "room:{$roomId}:pending_attack";
        if (!Redis::exists($pendingKey)) {
            throw new GameException(GameException::INVALID_ACTION, "No hay ningún ataque pendiente.", 422);
        }

        $pending = Redis::hgetall($pendingKey);
        $attacker = $pending['attacker'] ?? null;
        $target = $pending['target'] ?? null;

        if ($target !== $playerName) {
            throw new GameException(GameException::INVALID_ACTION, "No eres el objetivo de este ataque.", 403);
        }

        $targetKey = "room:{$roomId}:player:{$playerName}";

        if ($reaction === 'dodge') {
            if (!$cardId) {
                throw new GameException(GameException::CARD_NOT_IN_HAND, "No se ha indicado la carta de esquive.", 422);
            }

            $cards = json_decode(Redis::hget($targetKey, 'cards') ?: '[]', true);
            if (!is_array($cards)) {
                $cards = [];
            }

            $cardIndex = null;
            foreach ($cards as $index => $card) {
                if (!is_array($card)) {
                    continue;
                }
                if (($card['id'] ?? null) === $cardId && ($card['type'] ?? null) === 3) {
                    $cardIndex = $index;
                    break;
                }
            }

            if ($cardIndex === null) {
                throw new GameException(GameException::CARD_NOT_IN_HAND, "No tienes una carta de esquive válida.", 422);
            }

            // Consumir carta de esquive
            array_splice($cards, $cardIndex, 1);
            Redis::hset($targetKey, 'cards', json_encode($cards));

            // Limpiar ataque pendiente (sin aplicar daño)
            Redis::del($pendingKey);
        } elseif ($reaction === 'accept') {
            // Aplicar daño estándar del ataque
            Redis::hincrby($targetKey, 'stress', 1);
            Redis::del($pendingKey);
        } else {
            throw new GameException(GameException::INVALID_ACTION, "Reacción no válida.", 422);
        }

        event(new RoomStateUpdated($roomId));
    }
}
