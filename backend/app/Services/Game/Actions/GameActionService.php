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

    public function playAction(string $roomId, string $playerName, string $cardId, string $targetName, ?string $perkKey = null): void
    {
        $roomStateKey = "room:{$roomId}:state";

        if (!Redis::exists($roomStateKey)) {
            throw new RoomException(RoomException::ROOM_NOT_FOUND, "The room does not exist.", 404);
        }

        $currentTurn = Redis::hget($roomStateKey, 'current_turn_player_id');
        if ($currentTurn !== $playerName) {
            throw new GameException(GameException::NOT_YOUR_TURN, "No es tu turno.", 403);
        }

        if (Redis::exists("room:{$roomId}:pending_attack")) {
            throw new GameException(GameException::INVALID_ACTION, "Hay un ataque pendiente de resolver.", 422);
        }

        if (Redis::exists("room:{$roomId}:pending_sabotage")) {
            throw new GameException(GameException::INVALID_ACTION, "Hay un sabotaje pendiente de resolver.", 422);
        }

        $pendingMulti = json_decode(Redis::get("room:{$roomId}:pending_multi_attack") ?? 'null', true);
        if (!empty($pendingMulti) && ($pendingMulti['attacker'] ?? null) === $playerName) {
            throw new GameException(GameException::INVALID_ACTION, "Hay un ataque masivo pendiente de resolver.", 422);
        }

        if (!Redis::sismember("room:{$roomId}:players", $targetName)) {
            throw new GameException(GameException::INVALID_TARGET, "El jugador objetivo no está en la sala.", 404);
        }

        $handKey = "room:{$roomId}:player:{$playerName}:hand";
        $cards = collect(json_decode(Redis::get($handKey) ?: '[]', true));

        $card = $cards->firstWhere('id', $cardId);
        if (!$card) {
            throw new GameException(GameException::CARD_NOT_IN_HAND, "No tienes esa carta en tu mano.", 422);
        }

        $cardBaseId = $card['card_id'];

        // Match de validación
        match ($cardBaseId) {
            1 => $this->cardValidationService->validateAttack($roomId, $playerName, $targetName),
            2 => $this->cardValidationService->validateHeal($roomId, $playerName),
            4 => $this->cardValidationService->validateSteal($roomId, $playerName, $targetName),
            5 => $this->cardValidationService->validateShield($roomId, $playerName, $targetName),
            6 => $this->cardValidationService->validateBlock($roomId, $playerName, $targetName),
            7 => $this->cardValidationService->validateAttackAll($roomId, $playerName),
            8 => $this->cardValidationService->validateHealAll($roomId),
            9 => $this->cardValidationService->validateSabotage($roomId, $playerName, $targetName),
            10 => $this->cardValidationService->validateVision($roomId, $playerName),
            11 => $this->cardValidationService->validateDistance($roomId, $playerName, $targetName),
            12 => $this->cardValidationService->validateClean($roomId, $playerName, $targetName, $perkKey),
            13 => $this->cardValidationService->validateStorage($roomId, $playerName),
            14 => $this->cardValidationService->validateLuck($roomId, $playerName),
            default => null,
        };

        // Match de efecto
        match ($cardBaseId) {
            1 => $this->cardEffectService->applyAttack($roomId, $playerName, $targetName),
            2 => $this->cardEffectService->applyHeal($roomId, $playerName),
            4 => $this->cardEffectService->applySteal($roomId, $playerName, $targetName),
            5 => $this->cardEffectService->applyShield($roomId, $playerName),
            6 => $this->cardEffectService->applyBlock($roomId, $targetName),
            7 => $this->cardEffectService->applyAttackAll($roomId, $playerName),
            8 => $this->cardEffectService->applyHealAll($roomId),
            9 => $this->cardEffectService->applySabotage($roomId, $targetName),
            10 => $this->cardEffectService->applyVision($roomId, $playerName),
            11 => $this->cardEffectService->applyDistance($roomId, $playerName),
            12 => $this->cardEffectService->applyClean($roomId, $targetName, $perkKey),
            13 => $this->cardEffectService->applyStorage($roomId, $playerName),
            14 => $this->cardEffectService->applyLuck($roomId, $playerName),
            default => null,
        };

        $this->handService->findAndRemoveCard($roomId, $playerName, $cardId);

        // Estructurar la acción pura para el frontend
        $cardAction = [
            'card_id' => $cardBaseId,
            'source'  => $playerName,
            'target'  => $targetName,
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
