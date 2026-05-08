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

    public function reactToAttack(string $roomId, string $playerName, string $reaction, ?string $cardId = null): void
    {
        $pendingKey = "room:{$roomId}:pending_attack";

        if (!Redis::exists($pendingKey)) {
            throw new GameException(GameException::INVALID_ACTION, "No hay ningún ataque pendiente.", 422);
        }

        $pending = Redis::hgetall($pendingKey);
        if (($pending['target'] ?? null) !== $playerName) {
            throw new GameException(GameException::INVALID_ACTION, "No eres el objetivo de este ataque.", 403);
        }

        if ($reaction === 'dodge') {
            if (!$cardId) {
                throw new GameException(GameException::CARD_NOT_IN_HAND, "No se ha indicado la carta de esquive.", 422);
            }

            $card = $this->handService->findAndRemoveCard($roomId, $playerName, $cardId);

            if (($card['card_id'] ?? null) !== 3) {
                throw new GameException(GameException::INVALID_ACTION, "La carta seleccionada no es un esquive.", 422);
            }

            Redis::del($pendingKey);
            Redis::hincrby("room:{$roomId}:player:{$playerName}:stats", 'dodged_attacks', 1);
        } elseif ($reaction === 'accept') {
            app(CombatService::class)->applyDamageAndCheck($roomId, $pending['attacker'], $playerName);
            Redis::del($pendingKey);
        } else {
            throw new GameException(GameException::INVALID_ACTION, "Reacción no válida.", 422);
        }

        $attackerName = $pending['attacker'];

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

    public function resolveLuckChallenge(string $roomId, string $playerName, string $chosenColor): bool
    {
        $challengeKey = "room:{$roomId}:luck_challenge:{$playerName}";

        $challengeDataStr = Redis::get($challengeKey);

        if (!$challengeDataStr) {
            throw new \Exception('No hay ningún desafío activo.');
        }

        $challengeData = json_decode($challengeDataStr, true);

        // Extraer solo el color correcto
        $correctColor = $challengeData['correct_color'] ?? null;
        $isSuccess = ($chosenColor === $correctColor);

        Redis::del($challengeKey);

        if ($isSuccess) {
            app(TurnService::class)->resumeTurnTimer($roomId);
            $msg = __('game.luckySuccess', ['player' => $playerName]);
            event(new RoomStateUpdated($roomId, $msg));
            return true;
        }

        // Falló
        app(TurnService::class)->advanceTurn($roomId);
        $msg = __('game.luckyFail', ['player' => $playerName]);
        event(new RoomStateUpdated($roomId, $msg));

        return false;
    }

    public function reactToMultiAttack(string $roomId, string $playerName, string $reaction, ?string $cardId = null): void
    {
        $pendingKey = "room:{$roomId}:pending_multi_attack";

        if (!Redis::exists($pendingKey)) {
            throw new GameException(GameException::INVALID_ACTION, "No hay ningún ataque múltiple pendiente.", 422);
        }

        $pending = json_decode(Redis::get($pendingKey), true);

        if (!in_array($playerName, $pending['targets'] ?? [])) {
            throw new GameException(GameException::INVALID_ACTION, "No eres objetivo de este ataque.", 403);
        }

        if ($reaction === 'dodge') {
            if (!$cardId) {
                throw new GameException(GameException::CARD_NOT_IN_HAND, "No se ha indicado la carta de esquive.", 422);
            }

            $card = $this->handService->findAndRemoveCard($roomId, $playerName, $cardId);

            if (($card['card_id'] ?? null) !== 3) {
                throw new GameException(GameException::INVALID_ACTION, "La carta seleccionada no es un esquive.", 422);
            }

            $pending['dodgers'][] = $playerName;
            Redis::hincrby("room:{$roomId}:player:{$playerName}:stats", 'dodged_attacks', 1);
        } elseif ($reaction === 'accept') {
            $this->combatService->applyDamageAndCheck($roomId, $pending['attacker'], $playerName);
        } else {
            throw new GameException(GameException::INVALID_ACTION, "Reacción no válida.", 422);
        }

        $pending['targets'] = array_values(array_filter(
            $pending['targets'],
            fn($t) => $t !== $playerName
        ));

        if (empty($pending['targets'])) {
            Redis::del($pendingKey);

            $allTargets = Redis::smembers("room:{$roomId}:players");
            $attacked = array_filter($allTargets, fn($p) => $p !== $pending['attacker']);
            $targetsStr = implode(', ', $attacked);

            // Narrativa masiva pura
            $logMessage = __('game.attacked_all', ['attacker' => $pending['attacker'], 'targets' => $targetsStr]);

            if (!empty($pending['dodgers'])) {
                $logMessage .= ' ' . __('game.multi_dodged', ['dodgers' => implode(', ', $pending['dodgers'])]);
            }

            if (!empty($pending['shielders'])) {
                $logMessage .= ' ' . __('game.shields_broken', ['shielders' => implode(', ', $pending['shielders'])]);
            }

            app(TurnService::class)->resumeTurnTimer($roomId);
            event(new RoomStateUpdated($roomId, $logMessage));
        } else {
            Redis::set($pendingKey, json_encode($pending));
            event(new RoomStateUpdated($roomId));
        }
    }

    public function resolveSabotage(string $roomId, string $playerName, string $cardId): void
    {
        $pendingSabotageTarget = Redis::get("room:{$roomId}:pending_sabotage");

        if (!$pendingSabotageTarget || $pendingSabotageTarget !== $playerName) {
            throw new GameException(GameException::INVALID_ACTION, "No eres el objetivo de ningún sabotaje.", 403);
        }

        $this->handService->findAndRemoveCard($roomId, $playerName, $cardId);

        $playerTurnStateKey = "room:{$roomId}:player:{$playerName}:turn_state";

        Redis::hset($playerTurnStateKey, 'must_discard', 0);

        Redis::del("room:{$roomId}:pending_sabotage");

        app(TurnService::class)->resumeTurnTimer($roomId);
        event(new RoomStateUpdated($roomId));
    }
}
