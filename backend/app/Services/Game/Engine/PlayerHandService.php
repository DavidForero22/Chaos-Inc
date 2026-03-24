<?php

namespace App\Services\Game\Engine;

use App\Events\RoomStateUpdated;
use App\Exceptions\GameException;
use App\Exceptions\RoomException;
use App\Support\CastHelper;
use Illuminate\Support\Facades\Redis;

class PlayerHandService
{
    /**
     * Busca una carta en la mano del jugador, la elimina y devuelve la carta eliminada.
     */
    public function findAndRemoveCard(string $roomId, string $playerName, string $cardId): array
    {
        $playerKey = "room:{$roomId}:player:{$playerName}";
        $cards = json_decode(Redis::hget($playerKey, 'cards') ?: '[]', true);
        if (!is_array($cards)) $cards = [];

        $cardIndex = null;
        $foundCard = null;

        foreach ($cards as $index => $card) {
            if (!is_array($card)) continue;
            if (($card['id'] ?? null) === $cardId) {
                $cardIndex = $index;
                $foundCard = $card;
                break;
            }
        }

        if ($cardIndex === null) {
            throw new GameException(GameException::CARD_NOT_IN_HAND, "No tienes esa carta en tu mano.", 422);
        }

        array_splice($cards, $cardIndex, 1);
        Redis::hset($playerKey, 'cards', json_encode($cards));
        Redis::hincrby($playerKey, 'cards_played', 1);

        return $foundCard;
    }

    public function discardCards(string $roomId, string $playerName, array $cardIdsToDiscard): void
    {
        $roomKey = "room:{$roomId}";

        if (!Redis::exists($roomKey)) {
            throw new RoomException(RoomException::ROOM_NOT_FOUND, "The room does not exist.", 404);
        }

        $currentTurn = Redis::hget($roomKey, 'current_turn_player_id');
        if ($currentTurn !== $playerName) {
            throw new GameException(GameException::NOT_YOUR_TURN, "No es tu turno.", 403);
        }

        $playerKey  = "room:{$roomId}:player:{$playerName}";
        $playerData = Redis::hgetall($playerKey);
        $cards      = json_decode($playerData['cards'] ?? '[]', true);
        if (!is_array($cards)) $cards = [];

        if (count($cardIdsToDiscard) === 0) {
            throw new GameException(GameException::INVALID_ACTION, "Debes seleccionar al menos una carta para descartar.", 422);
        }

        $initialCardCount = count($cards);

        $updatedCards = array_values(array_filter($cards, function ($card) use ($cardIdsToDiscard) {
            return !in_array($card['id'] ?? null, $cardIdsToDiscard);
        }));

        $discardedCount = $initialCardCount - count($updatedCards);

        if ($discardedCount !== count($cardIdsToDiscard)) {
            throw new GameException(GameException::CARD_NOT_IN_HAND, "Algunas cartas seleccionadas ya no están en tu mano.", 422);
        }

        // Guardar la nueva mano
        Redis::hset($playerKey, 'cards', json_encode($updatedCards));

        // Emitir el log normal de descarte
        $logMessage = __('game.discarded', [
            'player' => $playerName,
            'count'  => $discardedCount,
        ]);
        event(new RoomStateUpdated($roomId, $logMessage));

        // Si se ha quedado a 0 cartas, forzar el fin de su turno
        if (count($updatedCards) === 0) {
            event(new RoomStateUpdated($roomId));
            app(TurnService::class)->advanceTurn($roomId);
        }
    }

    public function resolveSabotage(string $roomId, string $playerName, string $cardId): void
    {
        $pendingSabotageTarget = Redis::get("room:{$roomId}:pending_sabotage");

        if (!$pendingSabotageTarget || $pendingSabotageTarget !== $playerName) {
            throw new GameException(GameException::INVALID_ACTION, "No eres el objetivo de ningún sabotaje.", 403);
        }

        $playerKey = "room:{$roomId}:player:{$playerName}";

        $this->findAndRemoveCard($roomId, $playerName, $cardId);

        // Limpiar el estado de sabotaje
        Redis::hset($playerKey, 'must_discard', 0);
        Redis::hdel($playerKey, 'must_discard_by');
        Redis::del("room:{$roomId}:pending_sabotage");

        event(new RoomStateUpdated($roomId));
    }
}
