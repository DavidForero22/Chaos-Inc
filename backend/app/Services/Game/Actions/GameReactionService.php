<?php
// app/Services/Game/Actions/RoomStateUpdated.php

namespace App\Services\Game\Actions;

use App\Events\RoomStateUpdated;
use App\Exceptions\GameException;
use App\Jobs\AutoEndTurnJob;
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

            if (($card['type'] ?? null) !== 3) {
                throw new GameException(GameException::INVALID_ACTION, "La carta seleccionada no es un esquive.", 422);
            }

            Redis::del($pendingKey);
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

        $this->resumeTurnTimer($roomId);

        event(new RoomStateUpdated($roomId, $logMessage));
    }

    public function resolveLuckChallenge(string $roomId, string $playerName, string $chosenColor): bool
    {
        $challengeKey = "room:{$roomId}:luck_challenge:{$playerName}";

        if (!Redis::exists($challengeKey)) {
            throw new \Exception('No hay ningún desafío activo.');
        }

        $correct = Redis::get($challengeKey);
        Redis::del($challengeKey);

        if ($chosenColor === $correct) {
            // Acertó

            $this->resumeTurnTimer($roomId);
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

            if (($card['type'] ?? null) !== 3) {
                throw new GameException(GameException::INVALID_ACTION, "La carta seleccionada no es un esquive.", 422);
            }

            $pending['dodgers'][] = $playerName;
        } elseif ($reaction === 'accept') {
            $this->combatService->applyDamageAndCheck($roomId, $pending['attacker'], $playerName);
        } else {
            throw new GameException(GameException::INVALID_ACTION, "Reacción no válida.", 422);
        }

        // Eliminar al jugador de los pendientes
        $pending['targets'] = array_values(array_filter(
            $pending['targets'],
            fn($t) => $t !== $playerName
        ));

        if (empty($pending['targets'])) {
            // Respuesta confirmada — limpiar y emitir log final
            Redis::del($pendingKey);

            $allTargets = Redis::smembers("room:{$roomId}:players");
            $attacked = array_filter($allTargets, fn($p) => $p !== $pending['attacker']);
            $targetsStr = implode(', ', $attacked);
            $logMessage = __('game.attacked_all', ['attacker' => $pending['attacker'], 'targets' => $targetsStr]);

            if (!empty($pending['dodgers'])) {
                $logMessage .= ' ' . __('game.multi_dodged', ['dodgers' => implode(', ', $pending['dodgers'])]);
            }

            if (!empty($pending['shielders'])) {
                $logMessage .= ' ' . __('game.shields_broken', ['shielders' => implode(', ', $pending['shielders'])]);
            }

            $this->resumeTurnTimer($roomId);
            event(new RoomStateUpdated($roomId, $logMessage));
        } else {
            // Aún quedan jugadores por responder
            Redis::set($pendingKey, json_encode($pending));
            event(new RoomStateUpdated($roomId, null));
        }
    }

    public function resolveSabotage(string $roomId, string $playerName, string $cardId): void
    {
        $pendingSabotageTarget = Redis::get("room:{$roomId}:pending_sabotage");

        if (!$pendingSabotageTarget || $pendingSabotageTarget !== $playerName) {
            throw new GameException(GameException::INVALID_ACTION, "No eres el objetivo de ningún sabotaje.", 403);
        }

        $playerKey = "room:{$roomId}:player:{$playerName}";

        $this->handService->findAndRemoveCard($roomId, $playerName, $cardId);

        // Limpiar el estado de sabotaje
        Redis::hset($playerKey, 'must_discard', 0);
        Redis::hdel($playerKey, 'must_discard_by');
        Redis::del("room:{$roomId}:pending_sabotage");

        $this->resumeTurnTimer($roomId);
        event(new RoomStateUpdated($roomId));
    }

    /**
     * Reanuda el temporizador del jugador activo tras una reacción.
     */
    private function resumeTurnTimer(string $roomId): void
    {
        $roomKey = "room:{$roomId}";
        $currentTurn = Redis::hget($roomKey, 'current_turn_player_id');

        if (!$currentTurn) return;

        $timeout = (int) (Redis::hget($roomKey, 'turn_timeout') ?: 30);
        $newTurnId = uniqid('turn_', true);

        Redis::hset($roomKey, 'current_turn_id', $newTurnId);
        Redis::hset($roomKey, 'turn_expires_at', now()->addSeconds($timeout)->timestamp);

        AutoEndTurnJob::dispatch($roomId, $currentTurn, $newTurnId)->delay(now()->addSeconds($timeout));
    }
}
