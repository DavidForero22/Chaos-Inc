<?php
// app/Services/Game/Engine/CombatService.php

namespace App\Services\Game\Engine;

use App\Events\RoomStateUpdated;
use App\Services\Game\Status\GameFinalizationService;
use App\Support\CastHelper;
use Illuminate\Support\Facades\Redis;

class CombatService
{
    public function __construct(
        protected GameFinalizationService $finalizationService
    ) {}

    public function applyDamageAndCheck(string $roomId, int $attackerId, int $targetId): void
    {
        $targetInfoKey    = "room:{$roomId}:player:{$targetId}:info";
        $targetStatsKey   = "room:{$roomId}:player:{$targetId}:stats";
        $attackerStatsKey = "room:{$roomId}:player:{$attackerId}:stats";
        $attackerInfoKey  = "room:{$roomId}:player:{$attackerId}:info";

        $role      = Redis::hget($targetInfoKey, 'role');
        $maxStress = ($role === 'boss') ? 5 : 4;

        Redis::hincrby($targetInfoKey, 'stress', 1);
        Redis::hincrby($targetStatsKey, 'damage_received', 1);
        Redis::hincrby($attackerStatsKey, 'damage_dealt', 1);

        $newStress = (int) Redis::hget($targetInfoKey, 'stress');

        if ($newStress >= $maxStress) {
            Redis::hset($targetInfoKey, 'is_dead', 1);
            Redis::hincrby($attackerStatsKey, 'eliminations', 1);

            //  Guardar nombre de quien mató al jugador
            $killerName = Redis::hget($attackerInfoKey, 'username') ?: 'Desconocido';
            Redis::hset($targetInfoKey, 'killer_name', $killerName);

            $this->checkVictory($roomId, $targetId);
        }
    }

    public function checkVictory(string $roomId, ?int $targetId = null): void
    {
        // Si alguien murió por el ataque, avisar por el chat de juego
        if ($targetId !== null) {
            $targetName = Redis::hget(
                "room:{$roomId}:player:{$targetId}:info",
                'username'
            ) ?? "Player {$targetId}";

            event(new RoomStateUpdated(
                $roomId,
                "{$targetName} ha sido eliminado."
            ));
        }

        $this->finalizationService->finalizeVictory($roomId, false);
    }

    /**
     * Obtiene la lista ordenada de jugadores que físicamente ocupan espacio en la mesa.
     */
    public function getActivePlayersInOrder(string $roomId): array
    {
        $turnOrderRaw = Redis::get("room:{$roomId}:turn_order") ?: '[]';
        $turnOrder    = json_decode($turnOrderRaw, true);

        if (!is_array($turnOrder) || empty($turnOrder)) {
            // Fallback por si acaso
            $turnOrder = Redis::smembers("room:{$roomId}:players");
        }

        $activePlayers = [];

        foreach ($turnOrder as $playerId) {
            // Consultar la conectividad y vitalidad
            $pInfoKey = "room:{$roomId}:player:{$playerId}:info";
            $pData    = Redis::hgetall($pInfoKey);

            $isOnline = CastHelper::toBool($pData['is_online'] ?? 1);
            $isDead   = CastHelper::toBool($pData['is_dead'] ?? 0);

            // Solo los vivos y conectados hacen de "muro"
            if ($isOnline && !$isDead) {
                $activePlayers[] = (int) $playerId;
            }
        }

        return $activePlayers;
    }

    /**
     * Calcula la distancia circular más corta entre dos jugadores.
     */
    public function getDistance(string $roomId, int $playerAId, int $playerBId): int
    {
        if ($playerAId === $playerBId) {
            return 0;
        }

        $activePlayers = $this->getActivePlayersInOrder($roomId);

        $indexA = array_search($playerAId, $activePlayers);
        $indexB = array_search($playerBId, $activePlayers);

        if ($indexA === false || $indexB === false) {
            return 999;
        }

        $n    = count($activePlayers);
        $diff = abs($indexA - $indexB);

        // Calcular la distancia física base
        $baseDistance = min($diff, $n - $diff);

        // Sumar el bonus de "lejanía" que tenga el objetivo
        $targetPerksKey = "room:{$roomId}:player:{$playerBId}:perks";

        $hasDistance = CastHelper::toBool(
            Redis::hget($targetPerksKey, 'has_distance') ?? 0
        );

        $targetBonus = $hasDistance ? 1 : 0;

        return $baseDistance + $targetBonus;
    }

    public function getPlayerRange(string $roomId, int $playerId): int
    {
        $playerPerksKey = "room:{$roomId}:player:{$playerId}:perks";

        $bonus = (int) (
            Redis::hget($playerPerksKey, 'vision_bonus') ?? 0
        );

        return 1 + $bonus;
    }
}
