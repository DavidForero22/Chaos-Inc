<?php
// app/Services/Game/Engine/CardValidationService.php

namespace App\Services\Game\Engine;

use App\Exceptions\GameException;
use App\Support\CardHelper;
use App\Support\CastHelper;
use Illuminate\Support\Facades\Redis;

class CardValidationService
{
    public function validateAttack(string $roomId, int $playerId, int $targetId): void
    {
        if ($playerId === $targetId) {
            throw new GameException(GameException::INVALID_TARGET, "No puedes atacarte a ti mismo.", 422);
        }

        $playerTurnStateKey = "room:{$roomId}:player:{$playerId}:turn_state";
        $alreadyAttacked = (int) (Redis::hget($playerTurnStateKey, 'single_attack_used_this_turn') ?? 0);

        // Verificar si tiene la pasiva caótica activa
        $hasChaoticPassive = Redis::hget("room:{$roomId}:player:{$playerId}:perks", 'chaotic_passive') == 1;

        $distance = app(CombatService::class)->getDistance($roomId, $playerId, $targetId);
        $playerRange = app(CombatService::class)->getPlayerRange($roomId, $playerId);

        // PRIMER ATAQUE: rango normal, sin restricción adicional
        if ($alreadyAttacked === 0) {
            // Validación normal de rango
            if ($distance > $playerRange) {
                throw new GameException(
                    GameException::INVALID_TARGET,
                    "El objetivo está demasiado lejos. Tu alcance actual es {$playerRange}.",
                    422
                );
            }
            return;
        }

        // ATAQUES ADICIONALES (ya atacó una vez)
        if ($alreadyAttacked >= 1 && !$hasChaoticPassive) {
            throw new GameException(
                GameException::INVALID_ACTION,
                "Ya has usado una carta de ataque individual en este turno.",
                422
            );
        }

        // Si tiene pasiva caótica y es un ataque adicional, solo puede atacar a distancia 1
        if ($hasChaoticPassive && $distance !== 1) {
            throw new GameException(
                GameException::INVALID_TARGET,
                "El caos pasivo solo permite ataques adicionales a jugadores adyacentes (distancia 1).",
                422
            );
        }
    }

    public function validateHeal(string $roomId, int $playerId): void
    {
        $playerInfoKey = "room:{$roomId}:player:{$playerId}:info";

        $currentStress = (int) (
            Redis::hget($playerInfoKey, 'stress') ?? 0
        );

        if ($currentStress <= 0) {
            throw new GameException(
                GameException::INVALID_ACTION,
                "No tienes estrés que curar.",
                422
            );
        }
    }

    public function validateSteal(string $roomId, int $playerId, int $targetId): void
    {
        if ($playerId === $targetId) {
            throw new GameException(
                GameException::INVALID_TARGET,
                "No puedes robarte a ti mismo.",
                422
            );
        }

        $targetHandKey = "room:{$roomId}:player:{$targetId}:hand";

        $targetCards = json_decode(
            Redis::get($targetHandKey) ?: '[]',
            true
        );

        if (!is_array($targetCards) || empty($targetCards)) {
            throw new GameException(
                GameException::INVALID_TARGET,
                "El objetivo no tiene cartas.",
                422
            );
        }
    }

    public function validateShield(string $roomId, int $playerId, int $targetId): void
    {
        if ($playerId !== $targetId) {
            throw new GameException(
                GameException::INVALID_TARGET,
                "El escudo solo puede aplicarse a ti mismo.",
                422
            );
        }

        $playerPerksKey = "room:{$roomId}:player:{$playerId}:perks";

        $alreadyHasShield = Redis::hget($playerPerksKey, 'has_shield') === '1';

        if ($alreadyHasShield) {
            throw new GameException(
                GameException::INVALID_ACTION,
                "Ya tienes un escudo activo.",
                422
            );
        }

        $this->checkPerkLimit($roomId, $playerId);
    }

    public function validateBlock(string $roomId, int $playerId, int $targetId): void
    {
        if ($playerId === $targetId) {
            throw new GameException(
                GameException::INVALID_TARGET,
                "No puedes bloquearte a ti mismo.",
                422
            );
        }

        $targetInfoKey  = "room:{$roomId}:player:{$targetId}:info";
        $targetPerksKey = "room:{$roomId}:player:{$targetId}:perks";

        $isDead = filter_var(
            Redis::hget($targetInfoKey, 'is_dead') ?? false,
            FILTER_VALIDATE_BOOLEAN
        );

        if ($isDead) {
            throw new GameException(
                GameException::INVALID_TARGET,
                "No puedes bloquear a un jugador eliminado.",
                422
            );
        }

        $isAlreadyBlocked = CastHelper::toBool(
            Redis::hget($targetPerksKey, 'is_blocked') ?? 0
        );

        if ($isAlreadyBlocked) {
            throw new GameException(
                GameException::INVALID_TARGET,
                "Este jugador ya está bloqueado.",
                422
            );
        }
    }

    public function validateAttackAll(string $roomId, int $playerId): void
    {
        $playerTurnStateKey = "room:{$roomId}:player:{$playerId}:turn_state";

        $alreadyAttacked = (int) (
            Redis::hget($playerTurnStateKey, 'multi_attack_used_this_turn') ?? 0
        );

        if ($alreadyAttacked === 1) {
            throw new GameException(
                GameException::INVALID_ACTION,
                "Ya has usado una carta de ataque masivo en este turno.",
                422
            );
        }
    }

    public function validateHealAll(string $roomId): void
    {
        $players = Redis::smembers("room:{$roomId}:players");

        $anyHasStress = false;

        foreach ($players as $playerId) {
            $pInfoKey = "room:{$roomId}:player:{$playerId}:info";

            $isDead = CastHelper::toBool(
                Redis::hget($pInfoKey, 'is_dead') ?? 0
            );

            $stress = (int) (
                Redis::hget($pInfoKey, 'stress') ?? 0
            );

            if (!$isDead && $stress > 0) {
                $anyHasStress = true;
                break;
            }
        }

        if (!$anyHasStress) {
            throw new GameException(
                GameException::INVALID_ACTION,
                "Ningún jugador tiene estrés que curar.",
                422
            );
        }
    }

    public function validateSabotage(string $roomId, int $playerId, int $targetId): void
    {
        if ($playerId === $targetId) {
            throw new GameException(
                GameException::INVALID_TARGET,
                "No puedes sabotearte a ti mismo.",
                422
            );
        }

        $targetInfoKey = "room:{$roomId}:player:{$targetId}:info";
        $targetHandKey = "room:{$roomId}:player:{$targetId}:hand";

        $isDead = CastHelper::toBool(
            Redis::hget($targetInfoKey, 'is_dead') ?? 0
        );

        if ($isDead) {
            throw new GameException(
                GameException::INVALID_TARGET,
                "No puedes sabotear a un jugador eliminado.",
                422
            );
        }

        $isOnline = CastHelper::toBool(
            Redis::hget($targetInfoKey, 'is_online') ?? 1
        );

        if (!$isOnline) {
            throw new GameException(
                GameException::INVALID_TARGET,
                "No puedes sabotear a un jugador desconectado.",
                422
            );
        }

        $targetCards = json_decode(
            Redis::get($targetHandKey) ?: '[]',
            true
        );

        if (!is_array($targetCards) || empty($targetCards)) {
            throw new GameException(
                GameException::INVALID_TARGET,
                "El objetivo no tiene cartas que descartar.",
                422
            );
        }
    }

    public function validateVision(string $roomId, int $playerId): void
    {
        $currentBonus = (int) Redis::hget(
            "room:{$roomId}:player:{$playerId}:perks",
            'vision_bonus'
        );

        if ($currentBonus >= 2) {
            throw new GameException(
                GameException::INVALID_ACTION,
                "Ya tienes el alcance máximo permitido.",
                422
            );
        }

        if ($currentBonus === 0) {
            $this->checkPerkLimit($roomId, $playerId);
        }
    }

    public function validateDistance(string $roomId, int $playerId, int $targetId): void
    {
        if ($playerId !== $targetId) {
            throw new GameException(
                GameException::INVALID_TARGET,
                "Solo puedes aplicarte este efecto a ti.",
                422
            );
        }

        $hasDistance = (int) Redis::hget(
            "room:{$roomId}:player:{$playerId}:perks",
            'has_distance'
        );

        if ($hasDistance >= 1) {
            throw new GameException(
                GameException::INVALID_ACTION,
                "Tu escritorio ya está lo más lejos posible.",
                422
            );
        }

        $this->checkPerkLimit($roomId, $playerId);
    }

    public function validateClean(
        string $roomId,
        int $playerId,
        int $targetId,
        ?string $perkKey
    ): void {
        if ($playerId === $targetId) {
            throw new GameException(
                GameException::INVALID_ACTION,
                "No puedes limpiarte a ti mismo.",
                422
            );
        }

        if (!$perkKey) {
            throw new GameException(
                GameException::INVALID_ACTION,
                "Debes especificar qué equipamiento quieres quitar.",
                422
            );
        }

        $targetPerksKey = "room:{$roomId}:player:{$targetId}:perks";

        // Comprobar si el rival tiene ese equipamiento activo (> 0)
        $perkValue = (int) Redis::hget($targetPerksKey, $perkKey);

        if ($perkValue <= 0) {
            throw new GameException(
                GameException::INVALID_ACTION,
                "El jugador objetivo no tiene ese equipamiento activo.",
                422
            );
        }
    }

    public function validateStorage(string $roomId, int $playerId): void
    {
        $hasStorage = (int) Redis::hget(
            "room:{$roomId}:player:{$playerId}:perks",
            'has_storage'
        );

        if ($hasStorage >= 1) {
            throw new GameException(
                GameException::INVALID_ACTION,
                "Ya tienes una carta de almacen.",
                422
            );
        }

        $this->checkPerkLimit($roomId, $playerId);
    }

    public function validateLuck(string $roomId, int $playerId): void
    {
        $hasLuck = (int) Redis::hget(
            "room:{$roomId}:player:{$playerId}:perks",
            'has_luck'
        );

        if ($hasLuck >= 1) {
            throw new GameException(
                GameException::INVALID_ACTION,
                "Ya tienes una carta de suerte.",
                422
            );
        }

        $this->checkPerkLimit($roomId, $playerId);
    }

    private function checkPerkLimit(string $roomId, int $playerId): void
    {
        $playerPerksKey = "room:{$roomId}:player:{$playerId}:perks";

        $hasShield   = (int) Redis::hget($playerPerksKey, 'has_shield');
        $visionBonus = (int) Redis::hget($playerPerksKey, 'vision_bonus');
        $hasDistance = (int) Redis::hget($playerPerksKey, 'has_distance');
        $hasStorage  = (int) Redis::hget($playerPerksKey, 'has_storage');
        $hasLuck     = (int) Redis::hget($playerPerksKey, 'has_luck');

        $slotsUsed = 0;

        if ($hasShield > 0) {
            $slotsUsed++;
        }

        if ($visionBonus > 0) {
            $slotsUsed++;
        }

        if ($hasDistance > 0) {
            $slotsUsed++;
        }

        if ($hasStorage > 0) {
            $slotsUsed++;
        }

        if ($hasLuck > 0) {
            $slotsUsed++;
        }

        if ($slotsUsed >= 3) {
            throw new GameException(
                GameException::INVALID_ACTION,
                "Has alcanzado el límite de 3 pasivas.",
                422
            );
        }
    }

    public function validateChaoticDraw(string $roomId, int $playerId, ?string $sacrificeCardId): void
    {
        CardHelper::checkSacrificeCardExists($roomId, $playerId, $sacrificeCardId);
    }

    public function validateChaoticPassive(string $roomId, int $playerId, ?string $sacrificeCardId): void
    {
        CardHelper::checkSacrificeCardExists($roomId, $playerId, $sacrificeCardId);
        // Asegurar que no tenga ya la pasiva caótica activa (para no acumular)
        $hasChaoticPassive = Redis::hget("room:{$roomId}:player:{$playerId}:perks", 'chaotic_passive') == 1;
        if ($hasChaoticPassive) {
            throw new GameException(GameException::INVALID_ACTION, "Ya tienes activado el caos pasivo.", 422);
        }
    }

    public function validateChaoticRevive(string $roomId, int $playerId, string $targetId, ?string $sacrificeCardId): void
    {
        CardHelper::checkSacrificeCardExists($roomId, $playerId, $sacrificeCardId);

        // Comprobar que el objetivo está muerto
        $targetInfo = Redis::hgetall("room:{$roomId}:player:{$targetId}:info");
        if (($targetInfo['is_dead'] ?? 0) != 1) {
            throw new GameException(GameException::INVALID_TARGET, "El jugador objetivo no está muerto.", 422);
        }
        // No se puede revivir a sí mismo
        if ($targetId === $playerId) {
            throw new GameException(GameException::INVALID_TARGET, "No puedes revivirte a ti mismo.", 422);
        }
    }
}
