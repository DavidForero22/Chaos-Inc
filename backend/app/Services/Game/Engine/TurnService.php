<?php
// app/Services/Game/Engine/TurnService.php

namespace App\Services\Game\Engine;

use App\Events\RoomStateUpdated;
use App\Exceptions\GameException;
use App\Exceptions\RoomException;
use App\Jobs\AutoEndTurnJob;
use App\Jobs\ResolveLuckChallengeJob;
use App\Services\Game\Status\GameFinalizationService;
use App\Support\CastHelper;
use Illuminate\Support\Facades\Redis;

class TurnService
{
    public function __construct(protected DeckService $deckService) {}

    public function advanceTurn(string $roomId): void
    {
        $roomStateKey = "room:{$roomId}:state";
        $roomInfoKey  = "room:{$roomId}:info";
        $turnOrderStr = Redis::get("room:{$roomId}:turn_order");

        if (!$turnOrderStr) return;

        $turnOrder = json_decode($turnOrderStr, true);
        $currentTurn = Redis::hget($roomStateKey, 'current_turn_player_id');

        $currentIndex = array_search($currentTurn, $turnOrder);
        if ($currentIndex === false) $currentIndex = 0;

        $totalPlayers = count($turnOrder);
        $nextIndex = $currentIndex;

        $hasWrapped = false;

        for ($i = 0; $i < $totalPlayers; $i++) {
            $nextIndex = ($nextIndex + 1) % $totalPlayers;
            $nextPlayer = $turnOrder[$nextIndex];

            if ($nextIndex === 0) {
                $hasWrapped = true;
            }

            $pInfoKey      = "room:{$roomId}:player:{$nextPlayer}:info";
            $pTurnStateKey = "room:{$roomId}:player:{$nextPlayer}:turn_state";
            $pPerksKey     = "room:{$roomId}:player:{$nextPlayer}:perks";

            $isOnline = Redis::hget($pInfoKey, 'is_online') !== '0';
            $isDead   = Redis::hget($pInfoKey, 'is_dead') === '1';
            $skipNext = Redis::hget($pTurnStateKey, 'skip_next_turn') === '1';

            if ($skipNext) {
                Redis::hset($pTurnStateKey, 'skip_next_turn', 0);
                continue;
            }

            if ($isOnline && !$isDead) {
                Redis::hset($roomStateKey, 'current_turn_player_id', $nextPlayer);

                $timeout = (int) (Redis::hget($roomInfoKey, 'turn_timeout') ?: 30);
                $turnId = uniqid('turn_', true);

                Redis::hset($roomStateKey, 'current_turn_id', $turnId);
                Redis::hset($roomStateKey, 'turn_expires_at', now()->addSeconds($timeout)->timestamp);

                $cardsToDraw = 2;
                $hasInertia = CastHelper::toBool(Redis::hget($pPerksKey, 'has_luck') ?? 0);

                AutoEndTurnJob::dispatch($roomId, $nextPlayer, $turnId)->delay(now()->addSeconds($timeout));

                if ($hasInertia) {
                    // Tirar los dados: 50% de probabilidad (del 1 al 100, si es <= 50 gana)
                    if (rand(1, 100) <= 50) {
                        $cardsToDraw = 3;

                        $logMessage = __('game.lucked_sucess', ['player' => $nextPlayer]);
                        event(new RoomStateUpdated($roomId, $logMessage));
                    }
                }

                $this->deckService->drawCardsForPlayer($roomId, $nextPlayer, $cardsToDraw);
                // ------------------------------------------

                if ($hasWrapped) {
                    Redis::hincrby($roomStateKey, 'round_number', 1);
                }

                // Si el siguiente jugador está bloqueado, crear el minijuego
                $isBlocked = Redis::hget($pPerksKey, 'is_blocked') === '1';
                if ($isBlocked) {
                    Redis::hset($pPerksKey, 'is_blocked', 0);
                    $colors = ['red', 'blue', 'green', 'yellow'];
                    $correct = $colors[array_rand($colors)];

                    Redis::setex("room:{$roomId}:luck_challenge:{$nextPlayer}", 60, $correct);

                    // Pausa: El turno no debe tener un cronometro
                    Redis::hset($roomStateKey, 'turn_expires_at', 0);

                    ResolveLuckChallengeJob::dispatch($roomId, $nextPlayer)->delay(15);
                } else {
                    // Turno normal: Poner el temporizador de turno
                    $timeout = (int) (Redis::hget($roomInfoKey, 'turn_timeout') ?: 30);
                    $turnId = uniqid('turn_', true);

                    Redis::hset($roomStateKey, 'current_turn_id', $turnId);
                    Redis::hset($roomStateKey, 'turn_expires_at', now()->addSeconds($timeout)->timestamp);

                    AutoEndTurnJob::dispatch($roomId, $nextPlayer, $turnId)->delay(now()->addSeconds($timeout));
                }

                break;
            }
        }
    }

    public function checkAndAdvanceTurnOnDisconnect(string $roomId, string $disconnectedPlayer): void
    {
        $currentTurn = Redis::hget("room:{$roomId}:state", 'current_turn_player_id');

        if ($currentTurn === $disconnectedPlayer) {
            $this->advanceTurn($roomId);
        }
    }

    public function endTurn(string $roomId, string $playerName): void
    {
        $roomStateKey  = "room:{$roomId}:state";
        $pInfoKey      = "room:{$roomId}:player:{$playerName}:info";
        $pPerksKey     = "room:{$roomId}:player:{$playerName}:perks";
        $pTurnStateKey = "room:{$roomId}:player:{$playerName}:turn_state";
        $pHandKey      = "room:{$roomId}:player:{$playerName}:hand";

        if (!Redis::exists($roomStateKey)) {
            throw new RoomException(RoomException::ROOM_NOT_FOUND, "The room does not exist.", 404);
        }

        $currentTurn = Redis::hget($roomStateKey, 'current_turn_player_id');
        if ($currentTurn !== $playerName) {
            throw new GameException(GameException::NOT_YOUR_TURN, "No es tu turno.", 403);
        }

        if (app(GameFinalizationService::class)->isGameEffectivelyOver($roomId)) {
            throw new GameException(
                GameException::CANNOT_SKIP_DURING_ENDING,
                "No puedes saltar turno mientras la partida está a punto de finalizar.",
                422
            );
        }

        if (Redis::exists("room:{$roomId}:pending_attack")) {
            throw new GameException(GameException::INVALID_ACTION, "Hay un ataque pendiente de resolver.", 422);
        }

        if (Redis::exists("room:{$roomId}:pending_sabotage")) {
            throw new GameException(GameException::INVALID_ACTION, "Hay un sabotaje pendiente de resolver.", 422);
        }

        // Validar límite de cartas en mano
        $currentStress  = (int) (Redis::hget($pInfoKey, 'stress') ?? 0);
        $role           = Redis::hget($pInfoKey, 'role') ?? '';
        $isActingBoss   = CastHelper::toBool(Redis::hget($pInfoKey, 'acting_boss') ?? 0);

        $isBossOrActing = ($role === 'boss') || $isActingBoss;
        $maxStress      = $isBossOrActing ? 5 : 4;

        $storageBonus   = CastHelper::toBool(Redis::hget($pPerksKey, 'has_storage') ?? 0) ? 1 : 0;
        $maxHandSize    = max(1, ($maxStress + 1) - $currentStress) + $storageBonus;

        $currentCards   = json_decode(Redis::get($pHandKey) ?: '[]', true);

        if (count($currentCards) > $maxHandSize) {
            throw new GameException(
                GameException::INVALID_ACTION,
                "Debes descartar cartas antes de terminar tu turno. Máximo permitido: {$maxHandSize}.",
                422
            );
        }

        Redis::hset($pTurnStateKey, 'single_attack_used_this_turn', 0);
        Redis::hset($pTurnStateKey, 'multi_attack_used_this_turn', 0);

        $this->advanceTurn($roomId);
        event(new RoomStateUpdated($roomId));
    }


    /**
     * Reanuda el temporizador del jugador activo
     */
    public function resumeTurnTimer(string $roomId): void
    {
        $roomStateKey = "room:{$roomId}:state";
        $roomInfoKey  = "room:{$roomId}:info";

        $currentTurn = Redis::hget($roomStateKey, 'current_turn_player_id');

        if (!$currentTurn) return;

        $timeout = (int) (Redis::hget($roomInfoKey, 'turn_timeout') ?: 30);
        $newTurnId = uniqid('turn_', true);

        Redis::hset($roomStateKey, 'current_turn_id', $newTurnId);
        Redis::hset($roomStateKey, 'turn_expires_at', now()->addSeconds($timeout)->timestamp);

        AutoEndTurnJob::dispatch($roomId, $currentTurn, $newTurnId)->delay(now()->addSeconds($timeout));
    }
}
