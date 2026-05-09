<?php
// app/Services/Game/Actions/GameReactionService.php

namespace App\Services\Game\Actions;

use App\Events\RoomStateUpdated;
use App\Exceptions\GameException;
use App\Services\Game\Engine\CombatService;
use App\Services\Game\Engine\PlayerHandService;
use App\Services\Game\Engine\TurnService;
use Illuminate\Support\Facades\Redis;

class GameReactionService
{
    public function __construct(
        protected CombatService $combatService,
        protected PlayerHandService $handService,
    ) {}

    public function reactToAttack(string $roomId, int $playerId, string $reaction, ?string $cardId = null): void
    {
        $pendingKey = "room:{$roomId}:pending_attack";

        if (!Redis::exists($pendingKey)) {
            throw new GameException(
                GameException::INVALID_ACTION,
                "No hay ningún ataque pendiente.",
                422
            );
        }

        $pending = Redis::hgetall($pendingKey);

        if ((string) ($pending['target'] ?? '') !== (string) $playerId) {
            throw new GameException(
                GameException::INVALID_ACTION,
                "No eres el objetivo de este ataque.",
                403
            );
        }

        $playerName = Redis::hget(
            "room:{$roomId}:player:{$playerId}:info",
            'username'
        ) ?? "Player {$playerId}";

        $attackerId = (int) ($pending['attacker'] ?? 0);

        $attackerName = Redis::hget(
            "room:{$roomId}:player:{$attackerId}:info",
            'username'
        ) ?? "Player {$attackerId}";

        if ($reaction === 'dodge') {
            if (!$cardId) {
                throw new GameException(
                    GameException::CARD_NOT_IN_HAND,
                    "No se ha indicado la carta de esquive.",
                    422
                );
            }

            $card = $this->handService->findAndRemoveCard(
                $roomId,
                $playerId,
                $cardId
            );

            if (($card['card_id'] ?? null) !== 3) {
                throw new GameException(
                    GameException::INVALID_ACTION,
                    "La carta seleccionada no es un esquive.",
                    422
                );
            }

            Redis::del($pendingKey);

            Redis::hincrby(
                "room:{$roomId}:player:{$playerId}:stats",
                'dodged_attacks',
                1
            );
        } elseif ($reaction === 'accept') {
            app(CombatService::class)->applyDamageAndCheck(
                $roomId,
                $attackerId,
                $playerId
            );

            Redis::del($pendingKey);
        } else {
            throw new GameException(
                GameException::INVALID_ACTION,
                "Reacción no válida.",
                422
            );
        }

        $logMessage = $reaction === 'dodge'
            ? __('game.dodged', [
                'player'   => $playerName,
                'attacker' => $attackerName
            ])
            : __('game.tookDamage', [
                'player'   => $playerName,
                'attacker' => $attackerName
            ]);

        app(TurnService::class)->resumeTurnTimer($roomId);

        event(new RoomStateUpdated($roomId, $logMessage));
    }

    public function resolveLuckChallenge(string $roomId, int $playerId, string $chosenColor): bool
    {
        $challengeKey = "room:{$roomId}:luck_challenge:{$playerId}";

        $challengeDataStr = Redis::get($challengeKey);

        if (!$challengeDataStr) {
            throw new \Exception('No hay ningún desafío activo.');
        }

        $challengeData = json_decode($challengeDataStr, true);

        // Extraer solo el color correcto
        $correctColor = $challengeData['correct_color'] ?? null;

        $isSuccess = ($chosenColor === $correctColor);

        Redis::del($challengeKey);

        $playerName = Redis::hget(
            "room:{$roomId}:player:{$playerId}:info",
            'username'
        ) ?? "Player {$playerId}";

        if ($isSuccess) {
            app(TurnService::class)->resumeTurnTimer($roomId);

            $msg = __('game.challenge_sucess', [
                'player' => $playerName
            ]);

            event(new RoomStateUpdated($roomId, $msg));

            return true;
        }

        // Falló
        app(TurnService::class)->advanceTurn($roomId);

        $msg = __('game.challenge_fail', [
            'player' => $playerName
        ]);

        event(new RoomStateUpdated($roomId, $msg));

        return false;
    }

    public function reactToMultiAttack(string $roomId, int $playerId, string $reaction, ?string $cardId = null): void
    {
        $pendingKey = "room:{$roomId}:pending_multi_attack";

        if (!Redis::exists($pendingKey)) {
            throw new GameException(
                GameException::INVALID_ACTION,
                "No hay ningún ataque múltiple pendiente.",
                422
            );
        }

        $pending = json_decode(Redis::get($pendingKey), true);

        $targets = array_map('intval', $pending['targets'] ?? []);

        if (!in_array($playerId, $targets)) {
            throw new GameException(
                GameException::INVALID_ACTION,
                "No eres objetivo de este ataque.",
                403
            );
        }

        $playerName = Redis::hget(
            "room:{$roomId}:player:{$playerId}:info",
            'username'
        ) ?? "Player {$playerId}";

        $attackerId = (int) ($pending['attacker'] ?? 0);

        $attackerName = Redis::hget(
            "room:{$roomId}:player:{$attackerId}:info",
            'username'
        ) ?? "Player {$attackerId}";

        if ($reaction === 'dodge') {
            if (!$cardId) {
                throw new GameException(
                    GameException::CARD_NOT_IN_HAND,
                    "No se ha indicado la carta de esquive.",
                    422
                );
            }

            $card = $this->handService->findAndRemoveCard(
                $roomId,
                $playerId,
                $cardId
            );

            if (($card['card_id'] ?? null) !== 3) {
                throw new GameException(
                    GameException::INVALID_ACTION,
                    "La carta seleccionada no es un esquive.",
                    422
                );
            }

            $pending['dodgers'][] = $playerId;

            Redis::hincrby(
                "room:{$roomId}:player:{$playerId}:stats",
                'dodged_attacks',
                1
            );
        } elseif ($reaction === 'accept') {
            $this->combatService->applyDamageAndCheck(
                $roomId,
                $attackerId,
                $playerId
            );
        } else {
            throw new GameException(
                GameException::INVALID_ACTION,
                "Reacción no válida.",
                422
            );
        }

        $pending['targets'] = array_values(array_filter(
            $pending['targets'],
            fn($t) => (string) $t !== (string) $playerId
        ));

        if (empty($pending['targets'])) {
            Redis::del($pendingKey);

            $allTargets = Redis::smembers("room:{$roomId}:players");

            $attackedIds = array_filter(
                $allTargets,
                fn($p) => (string) $p !== (string) $attackerId
            );

            $attackedNames = [];

            foreach ($attackedIds as $targetId) {
                $attackedNames[] = Redis::hget(
                    "room:{$roomId}:player:{$targetId}:info",
                    'username'
                ) ?? "Player {$targetId}";
            }

            $targetsStr = implode(', ', $attackedNames);

            // Narrativa masiva pura
            $logMessage = __('game.attacked_all', [
                'attacker' => $attackerName,
                'targets'  => $targetsStr
            ]);

            if (!empty($pending['dodgers'])) {
                $dodgerNames = [];

                foreach ($pending['dodgers'] as $dodgerId) {
                    $dodgerNames[] = Redis::hget(
                        "room:{$roomId}:player:{$dodgerId}:info",
                        'username'
                    ) ?? "Player {$dodgerId}";
                }

                $logMessage .= ' ' . __('game.multi_dodged', [
                    'dodgers' => implode(', ', $dodgerNames)
                ]);
            }

            if (!empty($pending['shielders'])) {
                $shielderNames = [];

                foreach ($pending['shielders'] as $shielderId) {
                    $shielderNames[] = Redis::hget(
                        "room:{$roomId}:player:{$shielderId}:info",
                        'username'
                    ) ?? "Player {$shielderId}";
                }

                $logMessage .= ' ' . __('game.shields_broken', [
                    'shielders' => implode(', ', $shielderNames)
                ]);
            }

            app(TurnService::class)->resumeTurnTimer($roomId);

            event(new RoomStateUpdated($roomId, $logMessage));
        } else {
            Redis::set($pendingKey, json_encode($pending));

            event(new RoomStateUpdated($roomId));
        }
    }

    public function resolveSabotage(string $roomId, int $playerId, string $cardId): void
    {
        $pendingSabotageTarget = Redis::get(
            "room:{$roomId}:pending_sabotage"
        );

        if (
            !$pendingSabotageTarget ||
            (string) $pendingSabotageTarget !== (string) $playerId
        ) {
            throw new GameException(
                GameException::INVALID_ACTION,
                "No eres el objetivo de ningún sabotaje.",
                403
            );
        }

        $this->handService->findAndRemoveCard(
            $roomId,
            $playerId,
            $cardId
        );

        $playerTurnStateKey = "room:{$roomId}:player:{$playerId}:turn_state";

        Redis::hset($playerTurnStateKey, 'must_discard', 0);

        Redis::del("room:{$roomId}:pending_sabotage");

        app(TurnService::class)->resumeTurnTimer($roomId);

        event(new RoomStateUpdated($roomId));
    }
}
