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
        $testDeck = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
        shuffle($testDeck);

        foreach ($players as $index => $playerName) {
            $playerRole = $roles[$index];
            if ($playerRole === 'boss') {
                $bossPlayerName = $playerName;
            }

            $playerCards = array_splice($testDeck, 0, 3);

            $playerData = [
                'role' => $playerRole,
                'stress' => 0,
                'is_dead' => 0,
                'cards' => json_encode($playerCards),
                'is_online' => 1,
                'skip_next_turn' => 0
            ];

            Redis::hmset("room:{$roomId}:player:{$playerName}", $playerData);
            Redis::expire("room:{$roomId}:player:{$playerName}", 86400);
        }

        // Guardar estado global de la partida
        Redis::hset($roomKey, 'current_turn_player_id', $bossPlayerName);
        Redis::set("room:{$roomId}:turn_order", json_encode($players));
        Redis::expire("room:{$roomId}:turn_order", 86400);

        // Guardar mazo restante
        Redis::set("room:{$roomId}:deck", json_encode($testDeck));
        Redis::expire("room:{$roomId}:deck", 86400);

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
                'is_online' => (bool) filter_var($pData['is_online'] ?? true, FILTER_VALIDATE_BOOLEAN)
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
                'skip_next_turn' => (bool) filter_var($myData['skip_next_turn'] ?? false, FILTER_VALIDATE_BOOLEAN)
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
                break;
            }
        }
    }

    public function playAction(string $roomId, string $playerName, int $cardId, string $targetName): void
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

        // Validar al objetivo
        if ($playerName === $targetName) {
            throw new GameException(GameException::INVALID_TARGET, "No puedes atacarte a ti mismo.", 422);
        }
        if (!Redis::sismember("{$roomKey}:players", $targetName)) {
            throw new GameException(GameException::INVALID_TARGET, "El jugador objetivo no está en la sala.", 404);
        }

        // Validar que el jugador tiene la carta en la mano
        $playerKey = "room:{$roomId}:player:{$playerName}";
        $cards = json_decode(Redis::hget($playerKey, 'cards'), true);

        $cardIndex = array_search($cardId, $cards);
        if ($cardIndex === false) {
            throw new GameException(GameException::CARD_NOT_IN_HAND, "No tienes esa carta en tu mano.", 422);
        }

        // Consumir la carta jugada y robar una nueva del mazo
        array_splice($cards, $cardIndex, 1);
        $deck = json_decode(Redis::get("room:{$roomId}:deck"), true);

        if (!empty($deck)) {
            $newCard = array_shift($deck); // Robar la primera carta del mazo
            $cards[] = $newCard;
            Redis::set("room:{$roomId}:deck", json_encode($deck));
        }

        Redis::hset($playerKey, 'cards', json_encode($cards));

        // EFECTO DEL ATAQUE: Sumar 1 de estrés al objetivo
        $targetKey = "room:{$roomId}:player:{$targetName}";
        Redis::hincrby($targetKey, 'stress', 1);

        // Finalizar turno y avisar a todos
        $this->advanceTurn($roomId);
        event(new RoomStateUpdated($roomId));
    }
}
