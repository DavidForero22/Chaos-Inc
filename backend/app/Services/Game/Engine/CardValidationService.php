<?php
// app/Services/Game/Engine/RoomStateUpdated.php

namespace App\Services\Game\Engine;

use App\Exceptions\GameException;
use App\Support\CastHelper;
use Illuminate\Support\Facades\Redis;

class CardValidationService
{
    public function validateAttack(string $roomId, string $playerName, string $targetName): void
    {
        if ($playerName === $targetName) {
            throw new GameException(GameException::INVALID_TARGET, "No puedes atacarte a ti mismo.", 422);
        }

        $playerKey = "room:{$roomId}:player:{$playerName}";
        $alreadyAttacked = (int) (Redis::hget($playerKey, 'single_attack_used_this_turn') ?? 0);

        if ($alreadyAttacked === 1) {
            throw new GameException(GameException::INVALID_ACTION, "Ya has usado una carta de ataque individual en este turno.", 422);
        }
    }

    public function validateHeal(string $roomId, string $playerName): void
    {
        $playerKey = "room:{$roomId}:player:{$playerName}";
        $currentStress = (int) (Redis::hget($playerKey, 'stress') ?? 0);

        if ($currentStress <= 0) {
            throw new GameException(GameException::INVALID_ACTION, "No tienes estrés que curar.", 422);
        }
    }

    public function validateSteal(string $roomId, string $playerName, string $targetName): void
    {
        if ($playerName === $targetName) {
            throw new GameException(GameException::INVALID_TARGET, "No puedes robarte a ti mismo.", 422);
        }

        $targetKey = "room:{$roomId}:player:{$targetName}";
        $targetCards = json_decode(Redis::hget($targetKey, 'cards') ?: '[]', true);

        if (!is_array($targetCards) || empty($targetCards)) {
            throw new GameException(GameException::INVALID_TARGET, "El objetivo no tiene cartas.", 422);
        }
    }

    public function validateShield(string $roomId, string $playerName, string $targetName): void
    {
        if ($playerName !== $targetName) {
            throw new GameException(GameException::INVALID_TARGET, "El escudo solo puede aplicarse a ti mismo.", 422);
        }

        $playerKey = "room:{$roomId}:player:{$playerName}";
        $alreadyHasShield = Redis::hget($playerKey, 'has_shield') === '1';

        if ($alreadyHasShield) {
            throw new GameException(GameException::INVALID_ACTION, "Ya tienes un escudo activo.", 422);
        }
    }

    public function validateBlock(string $roomId, string $playerName, string $targetName): void
    {
        if ($playerName === $targetName) {
            throw new GameException(GameException::INVALID_TARGET, "No puedes bloquearte a ti mismo.", 422);
        }

        $targetKey = "room:{$roomId}:player:{$targetName}";
        $isDead = filter_var(Redis::hget($targetKey, 'is_dead') ?? false, FILTER_VALIDATE_BOOLEAN);
        if ($isDead) {
            throw new GameException(GameException::INVALID_TARGET, "No puedes bloquear a un jugador eliminado.", 422);
        }

        $isAlreadyBlocked = CastHelper::toBool(Redis::hget($targetKey, 'is_blocked') ?? 0);
        if ($isAlreadyBlocked) {
            throw new GameException(GameException::INVALID_TARGET, "Este jugador ya está bloqueado.", 422);
        }
    }

    public function validateAttackAll(string $roomId, string $playerName): void
    {
        $playerKey = "room:{$roomId}:player:{$playerName}";
        $alreadyAttacked = (int) (Redis::hget($playerKey, 'multi_attack_used_this_turn') ?? 0);

        if ($alreadyAttacked === 1) {
            throw new GameException(GameException::INVALID_ACTION, "Ya has usado una carta de ataque masivo en este turno.", 422);
        }
    }

    public function validateHealAll(string $roomId): void
    {
        $players = Redis::smembers("room:{$roomId}:players");
        $anyHasStress = false;

        foreach ($players as $pName) {
            $pData = Redis::hgetall("room:{$roomId}:player:{$pName}");
            $isDead = CastHelper::toBool($pData['is_dead'] ?? 0);
            $stress = (int) ($pData['stress'] ?? 0);

            if (!$isDead && $stress > 0) {
                $anyHasStress = true;
                break;
            }
        }

        if (!$anyHasStress) {
            throw new GameException(GameException::INVALID_ACTION, "Ningún jugador tiene estrés que curar.", 422);
        }
    }
}
