<?php
// app/Services/Game/Actions/GameActionService.php

namespace App\Services\Game\Actions;

use App\Events\RoomStateUpdated;
use App\Exceptions\GameException;
use App\Exceptions\RoomException;
use App\Jobs\AutoEndTurnJob;
use App\Services\Game\Engine\CardValidationService;
use App\Services\Game\Engine\PlayerHandService;
use Illuminate\Support\Facades\Redis;

class GameActionService
{
    public function __construct(
        protected PlayerHandService $handService,
        protected CardEffectService $cardEffectService,
        protected CardValidationService $cardValidationService,
    ) {}

    public function playAction(string $roomId, string $playerId, string $cardId, string $targetId, ?string $perkKey = null): void
    {
        $roomStateKey = "room:{$roomId}:state";

        if (!Redis::exists($roomStateKey)) {
            throw new RoomException(RoomException::ROOM_NOT_FOUND, "The room does not exist.", 404);
        }

        $currentTurn = Redis::hget($roomStateKey, 'current_turn_player_id');
        if ($currentTurn !== $playerId) {
            throw new GameException(GameException::NOT_YOUR_TURN, "No es tu turno.", 403);
        }

        if (Redis::exists("room:{$roomId}:pending_attack")) {
            throw new GameException(GameException::INVALID_ACTION, "Hay un ataque pendiente de resolver.", 422);
        }

        if (Redis::exists("room:{$roomId}:pending_sabotage")) {
            throw new GameException(GameException::INVALID_ACTION, "Hay un sabotaje pendiente de resolver.", 422);
        }

        $pendingMulti = json_decode(Redis::get("room:{$roomId}:pending_multi_attack") ?? 'null', true);
        if (!empty($pendingMulti) && ($pendingMulti['attacker'] ?? null) === $playerId) {
            throw new GameException(GameException::INVALID_ACTION, "Hay un ataque masivo pendiente de resolver.", 422);
        }

        if (!Redis::sismember("room:{$roomId}:players", $targetId)) {
            throw new GameException(GameException::INVALID_TARGET, "El jugador objetivo no está en la sala.", 404);
        }

        $handKey = "room:{$roomId}:player:{$playerId}:hand";
        $cards = collect(json_decode(Redis::get($handKey) ?: '[]', true));

        $card = $cards->firstWhere('id', $cardId);
        if (!$card) {
            throw new GameException(GameException::CARD_NOT_IN_HAND, "No tienes esa carta en tu mano.", 422);
        }

        $cardBaseId = $card['card_id'];

        // Match de validación
        match ($cardBaseId) {
            1 => $this->cardValidationService->validateAttack($roomId, $playerId, $targetId),
            2 => $this->cardValidationService->validateHeal($roomId, $playerId),
            4 => $this->cardValidationService->validateSteal($roomId, $playerId, $targetId),
            5 => $this->cardValidationService->validateShield($roomId, $playerId, $targetId),
            6 => $this->cardValidationService->validateBlock($roomId, $playerId, $targetId),
            7 => $this->cardValidationService->validateAttackAll($roomId, $playerId),
            8 => $this->cardValidationService->validateHealAll($roomId),
            9 => $this->cardValidationService->validateSabotage($roomId, $playerId, $targetId),
            10 => $this->cardValidationService->validateVision($roomId, $playerId),
            11 => $this->cardValidationService->validateDistance($roomId, $playerId, $targetId),
            12 => $this->cardValidationService->validateClean($roomId, $playerId, $targetId, $perkKey),
            13 => $this->cardValidationService->validateStorage($roomId, $playerId),
            14 => $this->cardValidationService->validateLuck($roomId, $playerId),
            default => null,
        };

        // Match de efecto
        match ($cardBaseId) {
            1 => $this->cardEffectService->applyAttack($roomId, $playerId, $targetId),
            2 => $this->cardEffectService->applyHeal($roomId, $playerId),
            4 => $this->cardEffectService->applySteal($roomId, $playerId, $targetId),
            5 => $this->cardEffectService->applyShield($roomId, $playerId),
            6 => $this->cardEffectService->applyBlock($roomId, $targetId),
            7 => $this->cardEffectService->applyAttackAll($roomId, $playerId),
            8 => $this->cardEffectService->applyHealAll($roomId, $playerId),
            9 => $this->cardEffectService->applySabotage($roomId, $targetId),
            10 => $this->cardEffectService->applyVision($roomId, $playerId),
            11 => $this->cardEffectService->applyDistance($roomId, $playerId),
            12 => $this->cardEffectService->applyClean($roomId, $targetId, $perkKey),
            13 => $this->cardEffectService->applyStorage($roomId, $playerId),
            14 => $this->cardEffectService->applyLuck($roomId, $playerId),
            default => null,
        };

        $this->handService->findAndRemoveCard($roomId, $playerId, $cardId);

        // ── REGISTRO DE ESTADÍSTICAS ──
        $statsKey     = "room:{$roomId}:player:{$playerId}:stats";
        $cardUsageKey = "room:{$roomId}:player:{$playerId}:card_usage";

        // Contador global de cartas jugadas
        Redis::hincrby($statsKey, 'cards_played', 1);

        // Contador específico por ID de carta (Top 5)
        Redis::hincrby($cardUsageKey, "card_{$cardBaseId}", 1);

        // Verificar si es una Pasiva usando estrictamente su tipado
        if (isset($card['type']) && $card['type'] === 'perk') {
            Redis::hincrby($statsKey, 'passives_played', 1);
        }

        // Estructurar la acción pura para el frontend
        $cardAction = [
            'card_id' => $cardBaseId,
            'source'  => $playerId,
            'target'  => $targetId,
        ];

        $newTurnId = uniqid('turn_', true);
        Redis::hset($roomStateKey, 'current_turn_id', $newTurnId);

        // Comprobar si la acción dejó un estado pendiente que requiera reacción
        $needsReaction = Redis::exists("room:{$roomId}:pending_attack") ||
            Redis::exists("room:{$roomId}:pending_sabotage") ||
            Redis::exists("room:{$roomId}:pending_multi_attack");

        if ($needsReaction) {
            // Calcular cuánto tiempo le sobraba y guardarlo
            $currentExpiresAt = (int) Redis::hget($roomStateKey, 'turn_expires_at');

            // Si currentExpiresAt es mayor que 0, calculamos la diferencia. Si no, asumir 0
            $timeLeft = $currentExpiresAt > 0 ? max(0, $currentExpiresAt - now('UTC')->timestamp) : 0;

            Redis::hset($roomStateKey, 'turn_paused_time_left', $timeLeft);

            // Borrar el tiempo de expiración para que el frontend detenga el reloj
            Redis::hset($roomStateKey, 'turn_expires_at', 0);

            // Generar un nuevo ID para invalidar el AutoEndTurnJob original que estaba contando.
            $pausedTurnId = uniqid('turn_paused_', true);
            Redis::hset($roomStateKey, 'current_turn_id', $pausedTurnId);
        }

        event(new RoomStateUpdated($roomId, null, $cardAction));
    }
}
