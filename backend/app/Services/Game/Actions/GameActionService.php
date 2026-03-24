<?php
// app/Services/Game/Actions/RoomStateUpdated.php

namespace App\Services\Game\Actions;

use App\Events\RoomStateUpdated;
use App\Exceptions\GameException;
use App\Exceptions\RoomException;
use App\Services\Game\Engine\CardValidationService;
use App\Services\Game\Engine\CombatService;
use App\Services\Game\Engine\PlayerHandService;
use App\Services\Game\Engine\TurnService;
use App\Services\Game\Status\GameFinalizationService;
use App\Support\CastHelper;
use Illuminate\Support\Facades\Redis;

class GameActionService
{
    public function __construct(
        protected CombatService $combatService,
        protected PlayerHandService $handService,
        protected GameFinalizationService $finalizationService,
        protected CardEffectService $cardEffectService,
        protected CardValidationService $cardValidationService,
    ) {}

    public function playAction(string $roomId, string $playerName, string $cardId, string $targetName): void
    {
        $roomKey = "room:{$roomId}";

        if (!Redis::exists($roomKey)) {
            throw new RoomException(RoomException::ROOM_NOT_FOUND, "The room does not exist.", 404);
        }

        $currentTurn = Redis::hget($roomKey, 'current_turn_player_id');
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

        if (!Redis::sismember("{$roomKey}:players", $targetName)) {
            throw new GameException(GameException::INVALID_TARGET, "El jugador objetivo no está en la sala.", 404);
        }

        $playerKey = "room:{$roomId}:player:{$playerName}";
        $cards = collect(json_decode(Redis::hget($playerKey, 'cards') ?: '[]', true));

        $card = $cards->firstWhere('id', $cardId);
        if (!$card) {
            throw new GameException(GameException::CARD_NOT_IN_HAND, "No tienes esa carta en tu mano.", 422);
        }

        $cardType = $card['type'];

        // Match de validación
        match ($cardType) {
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
            default => null,
        };

        // Match de efecto
        $effectResult = match ($cardType) {
            1 => $this->cardEffectService->applyAttack($roomId, $playerName, $targetName),
            2 => $this->cardEffectService->applyHeal($roomId, $playerName),
            4 => $this->cardEffectService->applySteal($roomId, $playerName, $targetName),
            5 => $this->cardEffectService->applyShield($roomId, $playerName),
            6 => $this->cardEffectService->applyBlock($roomId, $targetName),
            7 => $this->cardEffectService->applyAttackAll($roomId, $playerName),
            8 => $this->cardEffectService->applyHealAll($roomId),
            9 => $this->cardEffectService->applySabotage($roomId, $playerName, $targetName),
            10 => $this->cardEffectService->applyVision($roomId, $playerName),
            11 => $this->cardEffectService->applyDistance($roomId, $playerName),
            default => null,
        };

        $this->handService->findAndRemoveCard($roomId, $playerName, $cardId);

        // Match de log
        $logMessage = match ($cardType) {
            1 => ($effectResult === 'shield_broken')
                ? __('game.attack_shield_broken', ['attacker' => $playerName, 'target' => $targetName])
                : __('game.attacked', ['attacker' => $playerName, 'target' => $targetName]),
            2 => __('game.healed', ['player' => $playerName]),
            4 => __('game.stolen', ['player' => $playerName, 'target' => $targetName]),
            5 => __('game.shielded', ['player' => $playerName]),
            6 => __('game.blocked', ['player' => $playerName, 'target' => $targetName]),
            7 => null, // el log se construye en reactToMultiAttack cuando todos responden
            8 => __('game.healed_all', ['player' => $playerName]),
            9 => __('game.sabotaged', ['player' => $playerName, 'target' => $targetName]),
            10 => __('game.vision_equipped', ['player' => $playerName]),
            11 => __('game.distance_equipped', ['player' => $playerName]),
            default => null,
        };
        event(new RoomStateUpdated($roomId, $logMessage));
    }

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

            event(new RoomStateUpdated($roomId, $logMessage));
        } else {
            // Aún quedan jugadores por responder
            Redis::set($pendingKey, json_encode($pending));
            event(new RoomStateUpdated($roomId, null));
        }
    }
}
