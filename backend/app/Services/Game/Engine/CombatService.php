<?php

namespace App\Services\Game\Engine;

use App\Events\RoomStateUpdated;
use App\Services\Game\Status\GameFinalizationService;
use Illuminate\Support\Facades\Redis;

class CombatService
{
    public function __construct(
        protected GameFinalizationService $finalizationService
    ) {}

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

    public function checkVictory(string $roomId, ?string $targetName = null): void
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
                $winnerRole = 'intern';
            } else {
                $winnerRole = 'union';
            }
        } elseif ($unionAliveCount === 0 && !$internAlive) {
            // Si el Jefe sigue vivo y todas las amenazas están muertas
            $winnerRole = 'boss';
        }

        // Si nadie ha ganado aún, pero alguien murió, notificamos la eliminación
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
}
