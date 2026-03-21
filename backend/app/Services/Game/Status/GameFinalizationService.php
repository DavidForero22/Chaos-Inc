<?php
// app/Services/Game/Status/GameFinalizationService.php

namespace App\Services\Game\Status;

use App\Events\RoomListUpdated;
use App\Events\RoomStateUpdated;
use App\Jobs\CheckVictoryJob;
use App\Jobs\CleanupRoomJob;
use App\Models\User;
use App\Services\Admin\GameService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;

class GameFinalizationService
{
    public function __construct(protected GameService $gameService) {}

    public function finalize(string $roomId): void
    {
        $roomKey     = "room:{$roomId}";
        $room        = Redis::hgetall($roomKey);
        $playerNames = Redis::smembers("{$roomKey}:players");

        $winnerRole        = $room['winner_role'] ?? null;
        $totalRounds       = (int) ($room['round_number'] ?? 0);
        $totalEliminations = 0;

        $winningRoles = match ($winnerRole) {
            'boss'  => ['boss', 'secretary'],
            'union' => ['union'],
            'intern' => ['intern'],
            default => [],
        };

        $playersData   = [];

        foreach ($playerNames as $name) {
            $pData = Redis::hgetall("{$roomKey}:player:{$name}");
            $role  = $pData['role'] ?? 'intern';
            $elims = (int) ($pData['eliminations'] ?? 0);
            $totalEliminations += $elims;

            $user = User::where('username', $name)->first();
            $isGuest = !$user || $user->is_guest;

            $playersData[] = [
                'user_id'         => $user?->id,
                'is_guest'        => $isGuest,
                'display_name'    => $name,
                'has_won'         => in_array($role, $winningRoles),
                'role'            => $role,
                'damage_dealt'    => (int) ($pData['damage_dealt']    ?? 0),
                'damage_received' => (int) ($pData['damage_received'] ?? 0),
                'cards_played'    => (int) ($pData['cards_played']    ?? 0),
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

        CleanupRoomJob::dispatch($roomId)->delay(now()->addSeconds(10));
    }

    public function cleanupRedis(string $roomId, array $playerNames): void
    {
        $roomKey = "room:{$roomId}";
        $expireTime = 7;

        // Poner fecha de caducidad a todas las llaves de la sala
        foreach ($playerNames as $name) {
            Redis::expire("{$roomKey}:player:{$name}", $expireTime);
        }

        // Borrar tokens de la sala
        $prefix = config('database.redis.options.prefix', '');
        $tokenKeys = Redis::keys("{$roomKey}:token:*");

        foreach ($tokenKeys as $key) {
            $cleanKey = str_replace($prefix, '', $key);
            Redis::expire($cleanKey, $expireTime);
        }

        Redis::expire("{$roomKey}:deck", $expireTime);
        Redis::expire("{$roomKey}:turn_order", $expireTime);
        Redis::expire("{$roomKey}:pending_attack", $expireTime);
        Redis::expire("{$roomKey}:players", $expireTime);

        // Expirar la llave principal de la sala
        Redis::expire($roomKey, $expireTime);

        // La unica llave que se borra al instante es la de "active_rooms"
        Redis::srem("active_rooms", $roomId);
    }

    public function cancelAndCleanup(string $roomId): void
    {
        // Evita que se programe la limpieza 500 veces por segundo
        if (Redis::hget("room:{$roomId}", 'game_over') == 1) {
            return;
        }

        // Marcar estado para que el /sync no falle
        Redis::hset("room:{$roomId}", 'game_over', 1);
        Redis::hset("room:{$roomId}", 'winner_role', 'canceled');

        // Notificar al frontend
        event(new RoomStateUpdated($roomId));

        // Programar la destrucción total para dentro de 10 segundos
        CleanupRoomJob::dispatch($roomId)->delay(now()->addSeconds(10));

        Log::info("GameFinalizationService.php - Partida {$roomId} marcada como cancelada. Limpieza programada en 10s.\n");
    }

    public function destroyRoom(string $roomId): void
    {
        $allRoomKeys = Redis::keys("room:{$roomId}*");
        $prefix = config('database.redis.options.prefix', '');
        $cleanKeys = array_map(fn($key) => str_replace($prefix, '', $key), $allRoomKeys);

        if (!empty($cleanKeys)) {
            Redis::del($cleanKeys);
        }

        Redis::srem("active_rooms", $roomId);
        event(new RoomListUpdated($roomId));
    }

    public function checkDisconnectionVictory(string $roomId): bool
    {

        if (
            !Redis::exists("room:{$roomId}") ||
            Redis::hget("room:{$roomId}", 'game_over') === '1'
        ) {
            return false;
        }

        // --- NUEVO: Proteger la partida durante la herencia ---
        // Si el jefe se acaba de ir, no evaluamos la victoria hasta que se resuelva su cargo
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
            $pData    = Redis::hgetall("room:{$roomId}:player:{$pName}");
            $isOnline = ($pData['is_online'] ?? '1') !== '0';
            $isDead   = filter_var($pData['is_dead'] ?? false, FILTER_VALIDATE_BOOLEAN);
            if ($isOnline && !$isDead) {
                $role = ($pData['acting_boss'] ?? '0') === '1' ? 'boss' : ($pData['role'] ?? '');
                $onlineRoles[] = $role;
            }
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

        // --- CAMBIO: Aumentamos a 12s para dar margen a la herencia (que dura 10s) ---
        CheckVictoryJob::dispatch($roomId, $jobToken)->delay(now()->addSeconds(12));

        event(new RoomStateUpdated($roomId));
        Log::info("GameFinalizationService.php::checkDisconnectionVictory - Condición de victoria detectada en {$roomId}, esperando 12s...");
        return true;
    }

    public function finalizeVictory(string $roomId): void
    {
        $players     = Redis::smembers("room:{$roomId}:players");
        $onlineRoles = [];

        foreach ($players as $pName) {
            $pData    = Redis::hgetall("room:{$roomId}:player:{$pName}");
            $isOnline = ($pData['is_online'] ?? '1') !== '0';
            $isDead   = filter_var($pData['is_dead'] ?? false, FILTER_VALIDATE_BOOLEAN);
            if ($isOnline && !$isDead) {
                $onlineRoles[] = $pData['role'] ?? '';
            }
        }

        $roundNumber  = (int) Redis::hget("room:{$roomId}", 'round_number');
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
            // La condición ya no se cumple — alguien se reconectó
            Log::info("GameFinalizationService.php::finalizeVictory - condición de victoria ya no se cumple en {$roomId}");
            return;
        }

        if ($roundNumber >= 3) {
            Redis::hset("room:{$roomId}", 'game_over', 1);
            Redis::hset("room:{$roomId}", 'winner_role', $winnerRole);
            event(new RoomStateUpdated($roomId));
            $this->finalize($roomId);

            Log::info("GameFinalizationService.php::finalizeVictory - Victoria confirmada en sala {$roomId} para {$winnerRole} ($roundNumber rondas).");
        } else {
            Log::info("GameFinalizationService.php::finalizeVictory - Rondas insuficientes para ganar ($roundNumber). Cancelando victoria en {$roomId}.");
            $this->cancelAndCleanup($roomId);
        }
    }

    public function isGameEffectivelyOver(string $roomId): bool
    {
        $players = Redis::smembers("room:{$roomId}:players");
        $onlineRoles = [];

        foreach ($players as $pName) {
            $pData = Redis::hgetall("room:{$roomId}:player:{$pName}");
            $isOnline = ($pData['is_online'] ?? '1') !== '0';
            $isDead = filter_var($pData['is_dead'] ?? false, FILTER_VALIDATE_BOOLEAN);

            if ($isOnline && !$isDead) {
                // Consideramos al acting_boss como boss para la lógica de bandos
                $role = ($pData['acting_boss'] ?? '0') === '1' ? 'boss' : ($pData['role'] ?? '');
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
