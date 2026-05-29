<?php
// app/Services/Game/Engine/PlayerHandService.php

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
    public function findAndRemoveCard(string $roomId, int $playerId, string $cardId): array
    {
        $handKey  = "room:{$roomId}:player:{$playerId}:hand";
        $statsKey = "room:{$roomId}:player:{$playerId}:stats";

        $cards = json_decode(Redis::get($handKey) ?: '[]', true);

        if (!is_array($cards)) {
            $cards = [];
        }

        $cardIndex = null;
        $foundCard = null;

        foreach ($cards as $index => $card) {
            if (!is_array($card)) {
                continue;
            }

            if (($card['id'] ?? null) === $cardId) {
                $cardIndex = $index;
                $foundCard = $card;
                break;
            }
        }

        if ($cardIndex === null) {
            throw new GameException(
                GameException::CARD_NOT_IN_HAND,
                "No tienes esa carta en tu mano.",
                422
            );
        }

        array_splice($cards, $cardIndex, 1);

        Redis::set($handKey, json_encode($cards));
        Redis::hincrby($statsKey, 'cards_played', 1);

        return $foundCard;
    }

    public function discardCards(string $roomId, int $playerId, array $cardIdsToDiscard): void
    {
        $roomStateKey = "room:{$roomId}:state";

        if (!Redis::exists($roomStateKey)) {
            throw new RoomException(
                RoomException::ROOM_NOT_FOUND,
                "La sala no existe.",
                404
            );
        }

        $currentTurnPlayerId = Redis::hget(
            $roomStateKey,
            'current_turn_player_id'
        );

        if ((string) $currentTurnPlayerId !== (string) $playerId) {
            throw new GameException(
                GameException::NOT_YOUR_TURN,
                "No es tu turno.",
                403
            );
        }

        $handKey       = "room:{$roomId}:player:{$playerId}:hand";
        $playerInfoKey = "room:{$roomId}:player:{$playerId}:info";

        $playerName = Redis::hget($playerInfoKey, 'username') ?? "Player {$playerId}";

        $cards = json_decode(Redis::get($handKey) ?: '[]', true);

        if (!is_array($cards)) {
            $cards = [];
        }

        if (count($cardIdsToDiscard) === 0) {
            throw new GameException(
                GameException::INVALID_ACTION,
                "Debes seleccionar al menos una carta para descartar.",
                422
            );
        }

        $initialCardCount = count($cards);

        $updatedCards = array_values(array_filter(
            $cards,
            function ($card) use ($cardIdsToDiscard) {
                return !in_array($card['id'] ?? null, $cardIdsToDiscard);
            }
        ));

        $discardedCount = $initialCardCount - count($updatedCards);

        if ($discardedCount !== count($cardIdsToDiscard)) {
            throw new GameException(
                GameException::CARD_NOT_IN_HAND,
                "Algunas cartas seleccionadas ya no están en tu mano.",
                422
            );
        }

        Redis::set($handKey, json_encode($updatedCards));

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

    public function discardPerks(string $roomId, int $playerId, array $perksToDiscard): void
    {
        $roomStateKey = "room:{$roomId}:state";

        if (!Redis::exists($roomStateKey)) {
            throw new RoomException(
                RoomException::ROOM_NOT_FOUND,
                "La sala no existe.",
                404
            );
        }

        $currentTurnPlayerId = Redis::hget(
            $roomStateKey,
            'current_turn_player_id'
        );

        if ((string) $currentTurnPlayerId !== (string) $playerId) {
            throw new GameException(
                GameException::NOT_YOUR_TURN,
                "No es tu turno.",
                403
            );
        }

        if (count($perksToDiscard) === 0) {
            throw new GameException(
                GameException::INVALID_ACTION,
                "Debes seleccionar al menos un equipamiento para descartar.",
                422
            );
        }

        $playerPerksKey = "room:{$roomId}:player:{$playerId}:perks";
        $playerStatsKey = "room:{$roomId}:player:{$playerId}:stats";

        $playerInfoKey  = "room:{$roomId}:player:{$playerId}:info";

        $playerName = Redis::hget($playerInfoKey, 'username') ?? "Player {$playerId}";

        $discardedNames = [];

        $allowedPerks = config('game.perks.allowed_keys') ?? [];

        foreach ($perksToDiscard as $perkKey) {
            if (array_key_exists($perkKey, $allowedPerks)) {
                Redis::hset($playerPerksKey, $perkKey, 0);
                // Si descarta Suerte, reiniciar racha
                if ($perkKey === 'has_luck') {
                    Redis::hset($playerStatsKey, 'luck_streak', 0);
                }

                $discardedNames[] = $allowedPerks[$perkKey];
            }
        }

        if (!empty($discardedNames)) {
            $perksString = implode(', ', $discardedNames);

            $logMessage = __('game.perks_discarded', [
                'player' => $playerName,
                'perks'  => $perksString,
            ]);

            event(new RoomStateUpdated($roomId, $logMessage));
        }
    }

    /**
     * Fuerza el descarte de las últimas cartas obtenidas si el jugador excede el límite.
     * Útil para auto-descarte por inactividad.
     */
    public function enforceHandLimit(string $roomId, int $playerId): void
    {
        $playerInfoKey  = "room:{$roomId}:player:{$playerId}:info";
        $playerPerksKey = "room:{$roomId}:player:{$playerId}:perks";
        $playerHandKey  = "room:{$roomId}:player:{$playerId}:hand";

        $playerInfo = Redis::hgetall($playerInfoKey);

        // Si el jugador no existe (info vacía) o está muerto, no hacer nada
        if (
            empty($playerInfo) ||
            CastHelper::toBool($playerInfo['is_dead'] ?? 0)
        ) {
            return;
        }

        $cards = json_decode(Redis::get($playerHandKey) ?: '[]', true);

        if (!is_array($cards)) {
            $cards = [];
        }

        // Calcular el límite actual
        $currentStress = (int) ($playerInfo['stress'] ?? 0);

        $isBossOrActing =
            ($playerInfo['role'] ?? '') === 'boss' ||
            CastHelper::toBool($playerInfo['acting_boss'] ?? 0);

        $maxStress = $isBossOrActing ? 5 : 4;

        // El storage se consulta
        $storageBonus = CastHelper::toBool(
            Redis::hget($playerPerksKey, 'has_storage') ?? 0
        ) ? 1 : 0;

        $maxHandSize = max(
            1,
            ($maxStress + 1) - $currentStress
        ) + $storageBonus;

        $currentCount = count($cards);

        // Si tiene más cartas de las permitidas, cortar el final del array y guardar como string
        if ($currentCount > $maxHandSize) {
            $updatedCards = array_slice($cards, 0, $maxHandSize);

            Redis::set($playerHandKey, json_encode($updatedCards));

            event(new RoomStateUpdated($roomId));
        }
    }
}
