<?php
// app/Services/Game/Status/GameFinalizationService.php

namespace App\Services\Game\Status;

use App\Events\RoomListUpdated;
use App\Events\RoomStateUpdated;
use App\Jobs\CheckVictoryJob;
use App\Jobs\CleanupRoomJob;
use App\Models\User;
use App\Services\Admin\GameService;
use App\Support\CastHelper;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;

class GameFinalizationService
{
    public function __construct(protected GameService $gameService) {}

    public function finalize(string $roomId): void
    {
        $roomStateKey = "room:{$roomId}:state";
        $roomState    = Redis::hgetall($roomStateKey);
        $playerNames  = Redis::smembers("room:{$roomId}:players");

        $winnerRole        = $roomState['winner_role'] ?? null;
        $totalRounds       = (int) ($roomState['round_number'] ?? 0);
        $totalEliminations = 0;

        $winningRoles = match ($winnerRole) {
            'boss'   => ['boss', 'secretary'],
            'union'  => ['union'],
            'intern' => ['intern'],
            default  => [],
        };

        $playersData   = [];

        foreach ($playerNames as $name) {
            $pInfo  = Redis::hgetall("room:{$roomId}:player:{$name}:info");
            $pStats = Redis::hgetall("room:{$roomId}:player:{$name}:stats");

            $role  = $pInfo['role'] ?? 'intern';
            $elims = (int) ($pStats['eliminations'] ?? 0);
            $totalEliminations += $elims;

            $user = User::where('username', $name)->first();
            $isGuest = !$user || $user->is_guest;

            $playersData[] = [
                'user_id'         => $user?->id,
                'is_guest'        => $isGuest,
                'display_name'    => $name,
                'has_won'         => in_array($role, $winningRoles),
                'role'            => $role,
                'damage_dealt'    => (int) ($pStats['damage_dealt']    ?? 0),
                'damage_received' => (int) ($pStats['damage_received'] ?? 0),
                'cards_played'    => (int) ($pStats['cards_played']    ?? 0),
                'eliminations'    => $elims,
            ];
        }

        // Guardar siempre — aunque todos sean invitados
        $this->gameService->createGame([
            'winner_role'        => $winnerRole,
            'total_rounds'       => $totalRounds,
            'total_eliminations' => $totalEliminations,
            'players'            => $playersData,
        ]);

        $cleanupToken = uniqid('cleanup_', true);
        Redis::hset($roomStateKey, 'cleanup_token', $cleanupToken);

        CleanupRoomJob::dispatch($roomId, $cleanupToken)->delay(now()->addSeconds(10));
    }

    public function cancelAndCleanup(string $roomId): void
    {
        $roomStateKey = "room:{$roomId}:state";

        // Evita que se programe la limpieza 500 veces por segundo
        if (Redis::hget($roomStateKey, 'game_over') == 1) {
            return;
        }

        // Marcar estado para que el /sync no falle
        Redis::hset($roomStateKey, 'game_over', 1);
        Redis::hset($roomStateKey, 'winner_role', 'canceled');

        // Notificar al frontend
        event(new RoomStateUpdated($roomId));

        $cleanupToken = uniqid('cleanup_', true);
        Redis::hset($roomStateKey, 'cleanup_token', $cleanupToken);

        // Programar la destrucción total para dentro de 10 segundos
        CleanupRoomJob::dispatch($roomId, $cleanupToken)->delay(now()->addSeconds(10));
        
        Log::info("GameFinalizationService.php::cancelAndCleanup - Partida {$roomId} marcada como cancelada. Limpieza programada en 10s.\n");
    }

    public function destroyRoom(string $roomId): void
    {
        // Buscar todas las llaves de la sala
        $allRoomKeys = Redis::keys("room:{$roomId}*");

        if (!empty($allRoomKeys)) {
            // En Laravel, Redis::del acepta un array de llaves o múltiples argumentos
            // Como REDIS_PREFIX es "" en el .env, no hay que limpiar nada del string.
            Redis::del($allRoomKeys);

            Log::info("GameFinalizationService: Se han borrado " . count($allRoomKeys) . " llaves de la sala {$roomId}.");
        }

        // Limpieza de metadatos globales
        Redis::srem("active_rooms", $roomId);
        event(new \App\Events\RoomListUpdated($roomId));
    }

    public function checkDisconnectionVictory(string $roomId): bool
    {
        $roomStateKey = "room:{$roomId}:state";

        if (
            !Redis::exists($roomStateKey) ||
            Redis::hget($roomStateKey, 'game_over') === '1'
        ) {
            return false;
        }

        // Si el jefe se acaba de ir, no evaluar la victoria hasta que se resuelva su cargo
        if (
            Redis::exists("room:{$roomId}:boss_grace_period") ||
            Redis::exists("room:{$roomId}:acting_boss_grace_period")
        ) {
            Log::info("GameFinalizationService.php - Ignorando victoria, esperando herencia de jefe.");
            return false;
        }

        // Si ya hay una ending grace period activa, no relanzar
        if (Redis::exists("room:{$roomId}:ending_grace_period")) {
            return false;
        }

        $players     = Redis::smembers("room:{$roomId}:players");
        $onlineRoles = [];

        foreach ($players as $pName) {
            $pInfo    = Redis::hgetall("room:{$roomId}:player:{$pName}:info");

            $isOnline = ($pInfo['is_online'] ?? '1') !== '0';
            $isDead   = CastHelper::toBool($pInfo['is_dead'] ?? 0);

            if ($isOnline && !$isDead) {
                $role = ($pInfo['acting_boss'] ?? '0') === '1' ? 'boss' : ($pInfo['role'] ?? '');
                $onlineRoles[] = $role;
            }
        }

        // Si no hay nadie jugando, no evaluar victoria
        if (count($onlineRoles) === 0) {
            return false;
        }

        $hasUnion     = in_array('union', $onlineRoles);
        $hasBoss      = in_array('boss', $onlineRoles);
        $hasSecretary = in_array('secretary', $onlineRoles);
        $hasIntern    = in_array('intern', $onlineRoles);

        $isVictoryCondition =
            count($onlineRoles) <= 1 ||
            (!$hasUnion && !$hasIntern && ($hasBoss || $hasSecretary)) ||
            (!$hasBoss && !$hasSecretary && $hasUnion);

        if (!$isVictoryCondition) {
            Log::info("GameFinalizationService.php::checkDisconnectionVictory - Comprobación de victoria hecha. Todavía no ganó nadie");
            return false;
        }

        $jobToken = uniqid();
        Redis::set("room:{$roomId}:ending_grace_period", $jobToken);
        Redis::hset($roomStateKey, 'turn_expires_at', 0);

        CheckVictoryJob::dispatch($roomId, $jobToken)->delay(now()->addSeconds(12));

        event(new RoomStateUpdated($roomId));
        Log::info("GameFinalizationService.php::checkDisconnectionVictory - Condición de victoria detectada en {$roomId}, esperando 12s...");
        return true;
    }

    public function finalizeVictory(string $roomId, bool $isDisconnection = false): void
    {
        $roomStateKey = "room:{$roomId}:state";
        $players      = Redis::smembers("room:{$roomId}:players");
        $onlineRoles  = [];

        foreach ($players as $pName) {
            $pInfo    = Redis::hgetall("room:{$roomId}:player:{$pName}:info");

            $isOnline = ($pInfo['is_online'] ?? '1') !== '0';
            $isDead   = filter_var($pInfo['is_dead'] ?? false, FILTER_VALIDATE_BOOLEAN);

            if ($isOnline && !$isDead) {
                $onlineRoles[] = $pInfo['role'] ?? '';
            }
        }

        $roundNumber  = (int) Redis::hget($roomStateKey, 'round_number');
        $hasUnion     = in_array('union', $onlineRoles);
        $hasBoss      = in_array('boss', $onlineRoles);
        $hasSecretary = in_array('secretary', $onlineRoles);
        $hasIntern    = in_array('intern', $onlineRoles);

        if (count($onlineRoles) <= 1) {
            $soloRole   = $onlineRoles[0] ?? null;
            $winnerRole = match ($soloRole) {
                'boss', 'secretary' => 'boss',
                'intern'            => 'intern',
                'union'             => 'union',
                default             => null,
            };
        } elseif (!$hasUnion && !$hasIntern) {
            $winnerRole = 'boss';
        } elseif (!$hasBoss && !$hasSecretary) {
            $winnerRole = 'union';
        } else {
            // La condición ya no se cumple, alguien se reconectó o sigue vivo
            Log::info("GameFinalizationService.php::finalizeVictory - condición de victoria no se cumple en {$roomId}");
            return;
        }

        // Gana SI NO fue por desconexión, O SI fue por desconexión pero ya pasó la ronda 3
        if (!$isDisconnection || $roundNumber >= 3) {
            Redis::hset($roomStateKey, 'game_over', 1);
            Redis::hset($roomStateKey, 'winner_role', $winnerRole);
            event(new RoomStateUpdated($roomId));
            $this->finalize($roomId);

            $cause = $isDisconnection ? "abandono del rival (Ronda $roundNumber)" : "combate";
            Log::info("GameFinalizationService.php::finalizeVictory - Victoria confirmada en sala {$roomId} para {$winnerRole} por {$cause}.");
        } else {
            Log::info("GameFinalizationService.php::finalizeVictory - Rondas insuficientes para ganar por desconexión ($roundNumber). Cancelando victoria en {$roomId}.");
            $this->cancelAndCleanup($roomId);
        }
    }

    public function isGameEffectivelyOver(string $roomId): bool
    {
        $players = Redis::smembers("room:{$roomId}:players");
        $onlineRoles = [];

        foreach ($players as $pName) {
            $pInfo = Redis::hgetall("room:{$roomId}:player:{$pName}:info");

            $isOnline = ($pInfo['is_online'] ?? '1') !== '0';
            $isDead = filter_var($pInfo['is_dead'] ?? false, FILTER_VALIDATE_BOOLEAN);

            if ($isOnline && !$isDead) {
                // Consideramos al acting_boss como boss para la lógica de bandos
                $role = ($pInfo['acting_boss'] ?? '0') === '1' ? 'boss' : ($pInfo['role'] ?? '');
                $onlineRoles[] = $role;
            }
        }

        $hasUnion = in_array('union', $onlineRoles);
        $hasIntern = in_array('intern', $onlineRoles);
        $hasBossSide = in_array('boss', $onlineRoles) || in_array('secretary', $onlineRoles);

        // Si solo queda un bando online, la partida está "en suspenso"
        return count($onlineRoles) <= 1 ||
            (!$hasUnion && !$hasIntern && $hasBossSide) ||
            (!$hasBossSide && $hasUnion);
    }
}
