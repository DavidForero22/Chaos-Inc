<?php
// app/Services/Game/Actions/RoomStateUpdated.php

namespace App\Services\Game\Actions;

use App\Events\RoomStateUpdated;
use App\Exceptions\GameException;
use App\Exceptions\RoomException;
use App\Services\Game\Engine\CardValidationService;
use App\Services\Game\Engine\TurnService;
use App\Services\Game\Status\GameFinalizationService;
use Illuminate\Support\Facades\Redis;

class GameActionService
{
    public function __construct(
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

        $pendingMulti = json_decode(Redis::get("room:{$roomId}:pending_multi_attack") ?? 'null', true);
        if (!empty($pendingMulti) && ($pendingMulti['attacker'] ?? null) === $playerName) {
            throw new GameException(GameException::INVALID_ACTION, "Hay un ataque masivo pendiente de resolver.", 422);
        }

        if (!Redis::sismember("{$roomKey}:players", $targetName)) {
            throw new GameException(GameException::INVALID_TARGET, "El jugador objetivo no está en la sala.", 404);
        }

        $playerKey = "room:{$roomId}:player:{$playerName}";
        $cards = json_decode(Redis::hget($playerKey, 'cards') ?: '[]', true);
        if (!is_array($cards)) $cards = [];

        $cardIndex = null;
        $cardType = null;
        foreach ($cards as $index => $card) {
            if (!is_array($card)) continue;
            if (($card['id'] ?? null) === $cardId) {
                $cardIndex = $index;
                $cardType = $card['type'] ?? null;
                break;
            }
        }

        if ($cardIndex === null) {
            throw new GameException(GameException::CARD_NOT_IN_HAND, "No tienes esa carta en tu mano.", 422);
        }

        // Match de validación
        match ($cardType) {
            1 => $this->cardValidationService->validateAttack($roomId, $playerName, $targetName),
            2 => $this->cardValidationService->validateHeal($roomId, $playerName),
            4 => $this->cardValidationService->validateSteal($roomId, $playerName, $targetName),
            5 => $this->cardValidationService->validateShield($roomId, $playerName, $targetName),
            6 => $this->cardValidationService->validateBlock($roomId, $playerName, $targetName),
            7 => $this->cardValidationService->validateAttackAll($roomId, $playerName),
            8 => $this->cardValidationService->validateHealAll($roomId),
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
            default => null,
        };

        // Recargar la mano de Redis, por si algún efecto (como Robar) la modificó
        $updatedCards = json_decode(Redis::hget($playerKey, 'cards') ?: '[]', true);
        if (!is_array($updatedCards)) $updatedCards = [];

        // Buscar de nuevo el índice de la carta que acaba de jugar para borrarla
        $newCardIndex = null;
        foreach ($updatedCards as $index => $card) {
            if (($card['id'] ?? null) === $cardId) {
                $newCardIndex = $index;
                break;
            }
        }

        // Si la encuentra, borrar y guardar el estado final
        if ($newCardIndex !== null) {
            array_splice($updatedCards, $newCardIndex, 1);
            Redis::hset($playerKey, 'cards', json_encode($updatedCards));
            Redis::hincrby($playerKey, 'cards_played', 1);
        }

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

        $targetKey = "room:{$roomId}:player:{$playerName}";

        if ($reaction === 'dodge') {
            if (!$cardId) {
                throw new GameException(GameException::CARD_NOT_IN_HAND, "No se ha indicado la carta de esquive.", 422);
            }

            $cards = json_decode(Redis::hget($targetKey, 'cards') ?: '[]', true);
            if (!is_array($cards)) $cards = [];

            $cardIndex = null;
            foreach ($cards as $index => $card) {
                if (!is_array($card)) continue;
                if (($card['id'] ?? null) === $cardId && ($card['type'] ?? null) === 3) {
                    $cardIndex = $index;
                    break;
                }
            }

            if ($cardIndex === null) {
                throw new GameException(GameException::CARD_NOT_IN_HAND, "No tienes una carta de esquive válida.", 422);
            }

            array_splice($cards, $cardIndex, 1);
            Redis::hset($targetKey, 'cards', json_encode($cards));
            Redis::del($pendingKey);
        } elseif ($reaction === 'accept') {
            $attacker = $pending['attacker'];
            $this->applyDamageAndCheck($roomId, $attacker, $playerName);
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

    public function applyDamageAndCheck(string $roomId, string $attackerName, string $targetName): void
    {
        $targetKey   = "room:{$roomId}:player:{$targetName}";
        $attackerKey = "room:{$roomId}:player:{$attackerName}";
        $role        = Redis::hget($targetKey, 'role');
        $maxStress   = ($role === 'boss') ? 5 : 4;

        Redis::hincrby($targetKey, 'stress', 1);
        Redis::hincrby($targetKey, 'damage_received', 1);
        Redis::hincrby($attackerKey, 'damage_dealt', 1);

        $newStress = (int) Redis::hget($targetKey, 'stress');

        if ($newStress >= $maxStress) {
            Redis::hset($targetKey, 'is_dead', 1);
            Redis::hincrby($attackerKey, 'eliminations', 1);
            $this->checkVictory($roomId, $targetName);
        }
    }

    private function checkVictory(string $roomId, $targetName): void
    {
        $roomKey = "room:{$roomId}";
        $players = Redis::smembers("room:{$roomId}:players");

        $bossAlive       = false;
        $internAlive     = false;
        $unionAliveCount = 0;
        $totalAlive      = 0;

        // Recolectar el estado exacto de la mesa
        foreach ($players as $name) {
            $data   = Redis::hgetall("room:{$roomId}:player:{$name}");
            $isDead = filter_var($data['is_dead'] ?? false, FILTER_VALIDATE_BOOLEAN);
            $role   = $data['role'] ?? '';
            $isActingBoss = ($data['acting_boss'] ?? '0') === '1';

            if (!$isDead) {
                $totalAlive++;
                // El jefe efectivo es el real o quien tenga acting_boss
                if ($role === 'boss' || $isActingBoss) $bossAlive = true;
                if ($role === 'union')  $unionAliveCount++;
                if ($role === 'intern' && !$isActingBoss) $internAlive = true;
            }
        }
        $winnerRole = null;

        // Evaluar condiciones de victoria de forma jerárquica

        if (!$bossAlive) {
            // Si el jefe muere, el juego termina. ¿Quién gana?
            if ($totalAlive === 1 && $internAlive) {
                // El Becario es el único superviviente de toda la partida
                $winnerRole = 'intern';
            } else {
                // Si queda alguien más vivo además del Becario o si el Becario también murió, la victoria es para el Sindicato.
                $winnerRole = 'union';
            }
        } elseif ($unionAliveCount === 0 && !$internAlive) {
            // Si el Jefe sigue vivo y todas las amenazas están muertas
            $winnerRole = 'boss';
        }

        if ($winnerRole === null && $targetName !== null) {
            event(new RoomStateUpdated($roomId, "{$targetName} ha sido eliminado."));
        }

        // Si hay un ganador, procesar el final de la partida
        if ($winnerRole !== null) {
            Redis::hset($roomKey, 'game_over', 1);
            Redis::hset($roomKey, 'winner_role', $winnerRole);

            event(new RoomStateUpdated($roomId));
            $this->finalizationService->finalize($roomId);
        }
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

        $targetKey = "room:{$roomId}:player:{$playerName}";

        if ($reaction === 'dodge') {
            if (!$cardId) {
                throw new GameException(GameException::CARD_NOT_IN_HAND, "No se ha indicado la carta de esquive.", 422);
            }

            $cards = json_decode(Redis::hget($targetKey, 'cards') ?: '[]', true);
            $cardIndex = null;
            foreach ($cards as $index => $card) {
                if (($card['id'] ?? null) === $cardId && ($card['type'] ?? null) === 3) {
                    $cardIndex = $index;
                    break;
                }
            }

            if ($cardIndex === null) {
                throw new GameException(GameException::CARD_NOT_IN_HAND, "No tienes una carta de esquive válida.", 422);
            }

            array_splice($cards, $cardIndex, 1);
            Redis::hset($targetKey, 'cards', json_encode($cards));

            $pending['dodgers'][] = $playerName;
        } elseif ($reaction === 'accept') {
            $this->applyDamageAndCheck($roomId, $pending['attacker'], $playerName);
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
