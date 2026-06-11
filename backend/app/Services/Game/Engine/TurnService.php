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
use App\Support\RoomLogger;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;

class TurnService
{
    public function __construct(protected DeckService $deckService) {}

    public function advanceTurn(string $roomId): void
    {
        // Prevenir ejecuciones paralelas
        $lockKey = "room:{$roomId}:advancing_turn";

        if (Redis::exists($lockKey)) {
            RoomLogger::info($roomId, "TurnService.php::advanceTurn - Lock activo, saltando ejecución paralela");
            return;
        }

        // Adquirir lock por 3 segundos
        Redis::setex($lockKey, 3, '1');

        try {
            $roomStateKey = "room:{$roomId}:state";
            $roomInfoKey  = "room:{$roomId}:info";
            $turnOrderStr = Redis::get("room:{$roomId}:turn_order");

            if (!$turnOrderStr) return;

            $turnOrder = json_decode($turnOrderStr, true);
            $currentTurnId = Redis::hget($roomStateKey, 'current_turn_player_id');

            $currentIndex = array_search($currentTurnId, $turnOrder);
            if ($currentIndex === false) $currentIndex = 0;

            $totalPlayers = count($turnOrder);
            $nextIndex = $currentIndex;
            $hasWrapped = false;

            // CALCULA EL TIMEOUT UNA SOLA VEZ al inicio
            $timeout = (int) (Redis::hget($roomInfoKey, 'turn_timeout') ?: 30);
            $expiresAt = now('UTC')->addSeconds($timeout);
            $turnId = uniqid('turn_', true);

            for ($i = 0; $i < $totalPlayers; $i++) {
                $nextIndex = ($nextIndex + 1) % $totalPlayers;
                $nextPlayerId = $turnOrder[$nextIndex];

                if ($nextIndex === 0) {
                    $hasWrapped = true;
                }

                $pInfoKey      = "room:{$roomId}:player:{$nextPlayerId}:info";
                $pTurnStateKey = "room:{$roomId}:player:{$nextPlayerId}:turn_state";
                $pPerksKey     = "room:{$roomId}:player:{$nextPlayerId}:perks";
                $pStatsKey     = "room:{$roomId}:player:{$nextPlayerId}:stats";

                $isOnline = Redis::hget($pInfoKey, 'is_online') !== '0';
                $isDead   = Redis::hget($pInfoKey, 'is_dead') === '1';
                $skipNext = Redis::hget($pTurnStateKey, 'skip_next_turn') === '1';

                if ($skipNext) {
                    Redis::hset($pTurnStateKey, 'skip_next_turn', 0);
                    continue;
                }

                if ($isOnline && !$isDead) {
                    Redis::hset($roomStateKey, 'current_turn_player_id', $nextPlayerId);
                    Redis::hset($roomStateKey, 'current_turn_id', $turnId);
                    Redis::hset($roomStateKey, 'turn_expires_at', $expiresAt->timestamp);

                    // Recolecta datos para eventos antes de hacer cambios
                    $logMessage = null;
                    $achievementsToNotify = [];
                    $cardsToDraw = 2;
                    $drewExtra = false;

                    // --- ROBO DE CARTAS E INERCIA ---
                    $hasInertia = CastHelper::toBool(Redis::hget($pPerksKey, 'has_luck') ?? 0);

                    if ($hasInertia) {
                        if (rand(1, 100) <= 50) {
                            $cardsToDraw = 3;
                            $drewExtra = true;
                            Redis::hincrby($pStatsKey, 'luck_streak', 1);
                            $luckStreak = (int) Redis::hget($pStatsKey, 'luck_streak');

                            if ($luckStreak >= 3) {
                                $userId  = Redis::hget($pInfoKey, 'user_id');
                                $isGuest = Redis::hget($pInfoKey, 'is_guest') === '1';
                                if (!$isGuest && $userId) {
                                    $newAchievements = app(AchievementService::class)
                                        ->evaluateMidGameAchievements((int) $userId, [
                                            'luck_streak' => $luckStreak,
                                        ]);
                                    foreach ($newAchievements as $achId) {
                                        $achievementsToNotify[] = [
                                            'playerId'      => $nextPlayerId,
                                            'achievementId' => $achId,
                                        ];
                                    }
                                }
                            }

                            $playerName = Redis::hget($pInfoKey, 'username') ?: "Jugador {$nextPlayerId}";
                            $logMessage = __('game.lucked_sucess', ['player' => $playerName]);
                            RoomLogger::info($roomId, "TurnService.php::advanceTurn: El jugador {$playerName} (ID: {$nextPlayerId}) ha robado una carta extra.");
                        } else {
                            Redis::hset($pStatsKey, 'luck_streak', 0);
                        }
                    } else {
                        Redis::hset($pStatsKey, 'luck_streak', 0);
                    }

                    $this->deckService->drawCardsForPlayer($roomId, $nextPlayerId, $cardsToDraw);

                    if ($hasWrapped) {
                        Redis::hincrby($roomStateKey, 'round_number', 1);
                    }

                    if ($drewExtra) {
                        event(new RoomStateUpdated(
                            $roomId,
                            $logMessage,
                            null,
                            !empty($achievementsToNotify) ? $achievementsToNotify : null,
                            $nextPlayerId
                        ));
                    }

                    // --- MINIJUEGO O TURNO NORMAL ---
                    $isBlocked = Redis::hget($pPerksKey, 'is_blocked') === '1';

                    if ($isBlocked) {
                        Redis::hset($pPerksKey, 'is_blocked', 0);
                        $colors = ['red', 'blue', 'green', 'yellow'];
                        $correct = $colors[array_rand($colors)];
                        $challengeId = uniqid('luck_', true);

                        Redis::setex(
                            "room:{$roomId}:luck_challenge:{$nextPlayerId}",
                            60,
                            json_encode([
                                'correct_color' => $correct,
                                'challenge_id'  => $challengeId
                            ])
                        );

                        Redis::hset($roomStateKey, 'turn_expires_at', 0);

                        $playerName = Redis::hget($pInfoKey, 'username') ?: "Jugador {$nextPlayerId}";
                        RoomLogger::info($roomId, "TurnService.php::advanceTurn - ResolveLuckChallengeJob dispatch para {$playerName}, resuelve en 18s (challenge_id: {$challengeId})");

                        ResolveLuckChallengeJob::dispatch($roomId, $nextPlayerId, $challengeId)
                            ->delay(18);
                    } else {
                        RoomLogger::info(
                            $roomId,
                            "TurnService.php::advanceTurn - Iniciando turno para jugador {$nextPlayerId}, expira a: {$expiresAt} (timeout: {$timeout}s)"
                        );

                        AutoEndTurnJob::dispatch($roomId, $nextPlayerId, $turnId)
                            ->delay($timeout + 3);
                    }

                    break;
                }
            }
        } finally {
            // Liberar liberar el lock, incluso si hay excepciones
            Redis::del($lockKey);
        }
    }


    public function checkAndAdvanceTurnOnDisconnect(string $roomId, string $disconnectedPlayerId): void
    {
        $roomStateKey = "room:{$roomId}:state";
        $currentTurnPlayerId = Redis::hget($roomStateKey, 'current_turn_player_id');

        if ($currentTurnPlayerId === $disconnectedPlayerId) {
            // Verifica si hay un lock activo
            $lockKey = "room:{$roomId}:advancing_turn";

            // Si ya hay un proceso avanzando el turno, no hacer nada
            if (!Redis::exists($lockKey)) {
                $this->advanceTurn($roomId);
            } else {
                RoomLogger::info(
                    $roomId,
                    "TurnService.php::checkAndAdvanceTurnOnDisconnect - Lock detectado, esperando que otro proceso avance"
                );
            }
        }
    }


    public function endTurn(string $roomId, string $playerId): void
    {
        $roomStateKey  = "room:{$roomId}:state";
        $pInfoKey      = "room:{$roomId}:player:{$playerId}:info";
        $pPerksKey     = "room:{$roomId}:player:{$playerId}:perks";
        $pTurnStateKey = "room:{$roomId}:player:{$playerId}:turn_state";
        $pHandKey      = "room:{$roomId}:player:{$playerId}:hand";

        if (!Redis::exists($roomStateKey)) {
            throw new RoomException(RoomException::ROOM_NOT_FOUND, "La sala no existe.", 404);
        }

        $currentTurnId = Redis::hget($roomStateKey, 'current_turn_player_id');
        if ($currentTurnId !== $playerId) {
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

        // Validar límite de cartas en mano (Se mantiene igual)
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
     * Reanuda el temporizador del jugador activo conservando su tiempo sobrante
     */
    public function resumeTurnTimer(string $roomId): void
    {
        $roomStateKey = "room:{$roomId}:state";

        $currentTurnId = Redis::hget($roomStateKey, 'current_turn_player_id');

        if (!$currentTurnId) return;

        $newTurnId = uniqid('turn_', true);
        Redis::hset($roomStateKey, 'current_turn_id', $newTurnId);

        // Recuperar el tiempo congelado
        $pausedTimeLeft = Redis::hget($roomStateKey, 'turn_paused_time_left');

        if ($pausedTimeLeft !== null) {
            $timeLeft = (int) $pausedTimeLeft;

            // Si le quedan 3s o menos, darle 10s
            if ($timeLeft <= 3) {
                $timeLeft = 10;
            }

            Redis::hdel($roomStateKey, 'turn_paused_time_left');
        } else {
            // Fallback de seguridad: Si por algún motivo no se guardó, le damos el turno completo
            $roomInfoKey  = "room:{$roomId}:info";
            $timeLeft = (int) (Redis::hget($roomInfoKey, 'turn_timeout') ?: 30);
        }

        // Crear el nuevo tiempo de expiración basado en UTC y lanzar el Job
        $expireTime = now('UTC')->addSeconds($timeLeft);
        Redis::hset($roomStateKey, 'turn_expires_at', $expireTime->timestamp);

        RoomLogger::info($roomId, "TurnService.php::resumeTurnTimer - Continuado temporizador para las {$expireTime}");
        AutoEndTurnJob::dispatch($roomId, $currentTurnId, $newTurnId)->delay($expireTime);
    }
}
