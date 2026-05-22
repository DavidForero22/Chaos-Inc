<?php
// app/Services/Game/Status/GameFinalizationService.php

namespace App\Services\Game\Status;

use App\Events\GameFinalized;
use App\Events\RoomStateUpdated;
use App\Jobs\CheckVictoryJob;
use App\Jobs\CleanupRoomJob;
use App\Models\UserDiscoveredCard;
use App\Services\Admin\GameService;
use App\Services\Game\Engine\AchievementService;
use App\Services\Game\Engine\ExperienceService;
use App\Support\CastHelper;
use App\Support\RoomLogger;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Redis;

class GameFinalizationService
{
    public function __construct(
        protected GameService $gameService,
        protected AchievementService $achievementService,
        private readonly ExperienceService $experienceService,
    ) {}

    public function finalize(string $roomId): void
    {
        $roomStateKey = "room:{$roomId}:state";

        // Comprobar que realmente queden jugadores en el canal
        $pusher = Broadcast::driver()->getPusher();
        $channelName = "presence-room.{$roomId}";
        $activeConnectionsCount = 0;

        try {
            $response = $pusher->get_users_info($channelName);
            $activeConnectionsCount = count($response->users ?? []);
        } catch (\Exception $e) {
            // Si Reverb falla, se puede asumirr que no habian jugadores
            $activeConnectionsCount = 0;
        }

        // Si no hay jugadores conectados, borrar la sala al instante y no guardar datos
        if ($activeConnectionsCount === 0) {
            $cleanupToken = uniqid('cleanup_', true);
            Redis::hset($roomStateKey, 'cleanup_token', $cleanupToken);
            CleanupRoomJob::dispatch($roomId, $cleanupToken);

            return;
        }

        // Logica de victoria normal
        $roomState    = Redis::hgetall($roomStateKey);
        $playerIds    = Redis::smembers("room:{$roomId}:players");

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

        foreach ($playerIds as $playerId) {
            $pInfo  = Redis::hgetall("room:{$roomId}:player:{$playerId}:info");
            $isDead = (isset($pInfo['is_dead']) && $pInfo['is_dead'] == '1');
            $isOnline = CastHelper::toBool($pInfo['is_online'] ?? 1);

            // Si está desconectado y vivo, abandonó prematuramente
            // Saltar esta iteración para no guardar sus estadísticas ni contarle la partida
            if (!$isOnline && !$isDead) {
                continue;
            }

            $pStats = Redis::hgetall("room:{$roomId}:player:{$playerId}:stats");
            $cardUsage = Redis::hgetall("room:{$roomId}:player:{$playerId}:card_usage");

            // Limpiar el flag de inicialización que pusimos antes
            if (isset($cardUsage['initialized'])) {
                unset($cardUsage['initialized']);
            }

            $role  = $pInfo['role'] ?? 'intern';
            $elims = (int) ($pStats['eliminations'] ?? 0);
            $totalEliminations += $elims;

            $isActingBoss = (isset($pInfo['acting_boss']) && $pInfo['acting_boss'] == '1');
            $isGuest = CastHelper::toBool($pInfo['is_guest'] ?? 1);
            $displayName = $pInfo['username'] ?? "Player_{$playerId}";
            $userId = $pInfo['user_id'] ?? $playerId;

            $playersData[] = [
                'player_id'       => $playerId,
                'user_id'         => $userId,
                'is_guest'        => $isGuest,
                'display_name'    => $displayName,
                'has_won'         => in_array($role, $winningRoles),
                'role'            => $role,
                'is_dead'         => $isDead,
                'acting_boss'     => $isActingBoss,
                'damage_dealt'    => (int) ($pStats['damage_dealt'] ?? 0),
                'damage_received' => (int) ($pStats['damage_received'] ?? 0),
                'healing_done'    => (int) ($pStats['healing_done'] ?? 0),
                'cards_played'    => (int) ($pStats['cards_played'] ?? 0),
                'passives_played' => (int) ($pStats['passives_played'] ?? 0),
                'eliminations'    => $elims,
                'dodged_attacks'  => (int) ($pStats['dodged_attacks'] ?? 0),
                'cards_stolen'    => (int) ($pStats['cards_stolen']   ?? 0),
                'card_details'    => $cardUsage,
            ];
        }

        // Resolver MVP antes del segundo bucle para no iterar $playersData dos veces
        $mvpPlayerId = $this->experienceService->resolveMvp($playersData);


        // EVALUAR LOGROS
        $totalPlayers = count($playerIds);
        $achievementsUnlocked = $this->achievementService->evaluateEndGameAchievements($playersData, $totalPlayers);

        // Guardar siempre — aunque todos sean invitados
        $this->gameService->createGame([
            'winner_role'        => $winnerRole,
            'total_rounds'       => $totalRounds,
            'total_eliminations' => $totalEliminations,
            'players'            => $playersData,
        ]);

        // ---- Persistir nuevos descubrimientos y guardar experiencia ----
        foreach ($playersData as $player) {
            $xpSummary = $this->experienceService->processPlayer($player, $mvpPlayerId);

            $pInfo = Redis::hgetall("room:{$roomId}:player:{$playerId}:info");
            $isGuest = CastHelper::toBool($pInfo['is_guest'] ?? 1);
            if ($isGuest) {
                continue; // Los invitados no guardan progreso
            }
            $userId = $pInfo['user_id'] ?? null;
            if (!$userId) continue;

            $newKey = "room:{$roomId}:player:{$playerId}:new_cards";
            $newCardIds = Redis::smembers($newKey);
            if (!empty($newCardIds)) {
                $now = now();
                $insertData = [];
                foreach ($newCardIds as $cardId) {
                    $insertData[] = [
                        'user_id'       => $userId,
                        'card_id'       => (int) $cardId,
                        'discovered_at' => $now,
                    ];
                }
                // Usar insertOrIgnore para evitar duplicados (por si acaso)
                UserDiscoveredCard::insertOrIgnore($insertData);
            }
            // Guests no tienen canal privado donde recibir el evento
            if (!$player['is_guest']) {
                event(new GameFinalized((int) $player['user_id'], $xpSummary));
            }
        }

        event(new RoomStateUpdated($roomId, null, null, $achievementsUnlocked));
        $cleanupToken = uniqid('cleanup_', true);
        Redis::hset($roomStateKey, 'cleanup_token', $cleanupToken);

        CleanupRoomJob::dispatch($roomId, $cleanupToken)->delay(now('UTC')->addSeconds(10));
    }

    public function cancelAndCleanup(string $roomId): void
    {
        $roomStateKey = "room:{$roomId}:state";

        if (Redis::hget($roomStateKey, 'game_over') == 1) {
            return;
        }

        // Obtener datos de los jugadores (necesarios para guardar la partida cancelada)
        $playerIds = Redis::smembers("room:{$roomId}:players");
        $roundNumber = (int) Redis::hget($roomStateKey, 'round_number') ?: 1;
        $playersData = [];

        foreach ($playerIds as $playerId) {
            $pInfo = Redis::hgetall("room:{$roomId}:player:{$playerId}:info");
            $isGuest = CastHelper::toBool($pInfo['is_guest'] ?? 1);
            $isDead = CastHelper::toBool($pInfo['is_dead'] ?? 0);
            $displayName = $pInfo['username'] ?? "Player_{$playerId}";
            $userId = $pInfo['user_id'] ?? null;
            $role = $pInfo['role'] ?? 'intern';

            $playersData[] = [
                'user_id'      => $userId,
                'is_guest'     => $isGuest,
                'display_name' => $displayName,
                'role'         => $role,
                'is_dead'      => $isDead,
            ];
        }

        // Guardar la partida cancelada
        $this->gameService->createCanceledGame($playersData, $roundNumber);

        // Marcar estado para que el /sync no falle
        Redis::hset($roomStateKey, 'game_over', 1);
        Redis::hset($roomStateKey, 'winner_role', 'canceled');

        // Notificar al frontend
        event(new RoomStateUpdated($roomId));

        $cleanupToken = uniqid('cleanup_', true);
        Redis::hset($roomStateKey, 'cleanup_token', $cleanupToken);

        // Programar la destrucción total para dentro de 10 segundos
        CleanupRoomJob::dispatch($roomId, $cleanupToken)->delay(now('UTC')->addSeconds(10));

        RoomLogger::info($roomId, "GameFinalizationService.php::cancelAndCleanup: Partida marcada como cancelada. Limpieza programada en 10s.");
    }

    public function destroyRoom(string $roomId): void
    {
        // Borrar las relaciones jugador - sala
        $playerIds = Redis::smembers("room:{$roomId}:players");
        foreach ($playerIds as $playerId) {
            Redis::del("player:{$playerId}:room");
        }

        // Buscar todas las llaves de la sala
        $allRoomKeys = Redis::keys("room:{$roomId}*");

        if (!empty($allRoomKeys)) {
            Redis::del($allRoomKeys);
            RoomLogger::info($roomId, "GameFinalizationService.php: Se han borrado " . count($allRoomKeys) . " llaves.");
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
            RoomLogger::info($roomId, "GameFinalizationService.php: Ignorando victoria, esperando herencia de jefe.");
            return false;
        }

        // Si ya hay una ending grace period activa, no relanzar
        if (Redis::exists("room:{$roomId}:ending_grace_period")) {
            return false;
        }

        $playerIds   = Redis::smembers("room:{$roomId}:players");
        $onlineRoles = [];

        foreach ($playerIds as $playerId) {
            $pInfo    = Redis::hgetall("room:{$roomId}:player:{$playerId}:info");

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
            RoomLogger::info($roomId, "GameFinalizationService.php::checkDisconnectionVictory: Comprobación de victoria hecha. Todavía no ganó nadie.");
            return false;
        }

        $jobToken = uniqid();
        Redis::set("room:{$roomId}:ending_grace_period", $jobToken);
        Redis::hset($roomStateKey, 'turn_expires_at', 0);

        CheckVictoryJob::dispatch($roomId, $jobToken)->delay(now('UTC')->addSeconds(12));

        event(new RoomStateUpdated($roomId));
        RoomLogger::info($roomId, "GameFinalizationService.php::checkDisconnectionVictory: Condición de victoria detectada, esperando 12s...");
        return true;
    }

    public function finalizeVictory(string $roomId, string $winnerRole, bool $isDisconnection = false): void
    {
        $roomStateKey = "room:{$roomId}:state";
        $roundNumber  = (int) Redis::hget($roomStateKey, 'round_number');

        // Gana SI NO fue por desconexión, O SI fue por desconexión pero ya pasó la ronda 3
        if (!$isDisconnection || $roundNumber >= 3) {
            Redis::hset($roomStateKey, 'game_over', 1);
            Redis::hset($roomStateKey, 'winner_role', $winnerRole);

            event(new RoomStateUpdated($roomId));

            $this->finalize($roomId);

            $cause = $isDisconnection ? "abandono del rival (Ronda $roundNumber)" : "combate";
            RoomLogger::info($roomId, "GameFinalizationService.php::finalizeVictory: Victoria confirmada para {$winnerRole} por {$cause}.");
        } else {
            RoomLogger::info($roomId, "GameFinalizationService.php::finalizeVictory: Rondas insuficientes para ganar por desconexión ({$roundNumber}). Cancelando victoria.");
            $this->cancelAndCleanup($roomId);
        }
    }

    public function isGameEffectivelyOver(string $roomId): bool
    {
        $playerIds = Redis::smembers("room:{$roomId}:players");
        $onlineRoles = [];

        foreach ($playerIds as $playerId) {
            $pInfo = Redis::hgetall("room:{$roomId}:player:{$playerId}:info");

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

    /**
     * Verifica si hay condiciones de victoria y finaliza la partida si es el caso.
     */
    public function checkAndFinalizeVictory(string $roomId): bool
    {
        $rolesAlive = ['boss' => false, 'secretary' => false, 'intern' => false, 'union' => false];

        foreach (Redis::smembers("room:{$roomId}:players") as $playerId) {
            $info = Redis::hgetall("room:{$roomId}:player:{$playerId}:info");
            $isDead = CastHelper::toBool($info['is_dead'] ?? 0);
            $role = $info['role'] ?? 'none';

            if (!$isDead && $role !== 'none') {
                $rolesAlive[$role] = true;
            }
        }

        $winnerRole = null;

        if ($rolesAlive['boss'] && !$rolesAlive['secretary'] && !$rolesAlive['intern'] && !$rolesAlive['union']) {
            $winnerRole = 'boss';
        } elseif (!$rolesAlive['boss'] && $rolesAlive['union']) {
            $winnerRole = 'union';
        } elseif (!$rolesAlive['boss'] && !$rolesAlive['union'] && $rolesAlive['intern']) {
            $winnerRole = 'intern';
        }

        if ($winnerRole) {
            $this->finalizeVictory($roomId, $winnerRole, false);
            return true;
        }

        return false;
    }
}
