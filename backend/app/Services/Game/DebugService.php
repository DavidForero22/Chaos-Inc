<?php

namespace App\Services\Game;

use App\Events\RoomStateUpdated;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;

class DebugService
{
    private const ROLE_LIMITS = [
        'boss'      => 1,
        'secretary' => 1,
        'intern'    => 1,
        'union'     => 3,
    ];

    private const MAX_STRESS = [
        'boss'      => 5,
        'secretary' => 4,
        'intern'    => 4,
        'union'     => 4,
    ];

    private const MAX_PLAYERS = 6;

    // =========================================================================
    // Punto de entrada principal
    // =========================================================================

    public function processDebugAction(string $roomId, array $data): array
    {
        $playerId = $data['player_id'];
        $applied  = [];

        if (!Redis::sismember("room:{$roomId}:players", $playerId)) {
            throw new \Exception("El jugador '{$playerId}' no se encontró en la sala.", 422);
        }

        if (!empty($data['player_modifications'])) {
            $this->processPlayerModifications($roomId, $playerId, $data['player_modifications']);
            $applied['player_modifications'] = 'applied';
        }

        if (!empty($data['room_actions'])) {
            $applied['room_actions'] = $this->processRoomActions(
                $roomId,
                $playerId,
                $data['room_actions']
            );
        }

        if (!empty($data['spawn_ghost'])) {
            $applied['spawned_ghost'] = $this->spawnGhost($roomId, $data['spawn_ghost']);
        }

        event(new RoomStateUpdated($roomId, "El sistema ha modificado la partida (Debug)."));

        return $applied;
    }

    // =========================================================================
    // Modificaciones del jugador
    // =========================================================================

    private function processPlayerModifications(string $roomId, string $playerId, array $mods): void
    {
        // El orden importa: primero el rol (cambia el máximo de estrés), luego el estrés
        if (isset($mods['set_role'])) {
            $this->setRole($roomId, $playerId, $mods['set_role']);
        }

        if (array_key_exists('set_stress', $mods)) {
            $this->setStress($roomId, $playerId, (int) $mods['set_stress']);
        }

        if (!empty($mods['add_cards'])) {
            $this->addCardsToPlayer($roomId, $playerId, $mods['add_cards']);
        }
    }

    private function setStress(string $roomId, string $playerId, int $stress): void
    {
        $infoKey = "room:{$roomId}:player:{$playerId}:info";
        $role    = Redis::hget($infoKey, 'role') ?? 'union';
        $max     = self::MAX_STRESS[$role] ?? 4;

        Redis::hset($infoKey, 'stress', max(0, min($stress, $max)));
    }

    private function setRole(string $roomId, string $playerId, string $newRole): void
    {
        // Validar hueco disponible excluyendo al propio jugador (cambia su rol actual)
        $this->validateRoleSlot($roomId, $newRole, excludePlayerId: $playerId);

        $infoKey = "room:{$roomId}:player:{$playerId}:info";
        Redis::hset($infoKey, 'role', $newRole);

        // Si el nuevo máximo es menor al estrés actual, ajustarlo
        $currentStress = (int) Redis::hget($infoKey, 'stress');
        $newMax        = self::MAX_STRESS[$newRole] ?? 4;

        if ($currentStress > $newMax) {
            Redis::hset($infoKey, 'stress', $newMax);
        }
    }

    private function addCardsToPlayer(string $roomId, string $playerId, array $cardIds): void
    {
        $allCards = config('cards.cards', []);
        $cardMap  = collect($allCards)->keyBy('id');

        $handKey = "room:{$roomId}:player:{$playerId}:hand";
        $hand    = json_decode(Redis::get($handKey) ?: '[]', true);

        foreach ($cardIds as $cardId) {
            $card = $cardMap->get((int) $cardId);
            if ($card) {
                $cardArray = is_array($card) ? $card : (array) $card;

                $cardArray['id'] = (string) Str::uuid();
                $cardArray['card_id'] = (int) $cardId;
                $cardArray['name'] = $cardArray['display_name'] ?? $cardArray['base_name'];

                $hand[] = $cardArray;
            }
        }

        Redis::set($handKey, json_encode(array_values($hand)));
    }

    // =========================================================================
    // Acciones de sala
    // =========================================================================

    private function processRoomActions(string $roomId, string $actingPlayerId, array $actions): array
    {
        $results = [];

        if (isset($actions['force_win'])) {
            $this->forceWin($roomId, $actions['force_win']);
            $results['force_win'] = $actions['force_win'];
        }

        if (isset($actions['remove_ghost'])) {
            $this->removeGhost($roomId, $actingPlayerId, $actions['remove_ghost']);
            $results['removed_ghost'] = $actions['remove_ghost'];
        }

        return $results;
    }

    private function forceWin(string $roomId, string $outcome): void
    {
        Redis::hmset("room:{$roomId}:state", [
            'game_over'   => 1,
            'winner_role' => $outcome === 'cancel' ? '' : $outcome,
            'status'      => 'finished',
        ]);

        $message = $outcome === 'cancel'
            ? "La partida ha sido cancelada por el sistema."
            : "Partida finalizada de forma forzada.";

        event(new RoomStateUpdated($roomId, $message));
    }

    private function removeGhost(string $roomId, string $actingPlayerId, string $ghostId): void
    {
        if ($ghostId === $actingPlayerId) {
            throw new \Exception('No puedes eliminarte a ti mismo.', 422);
        }

        $isGhost = Redis::hget("room:{$roomId}:player:{$ghostId}:info", 'is_ghost');

        if ($isGhost !== '1') {
            throw new \Exception('Solo se pueden eliminar jugadores fantasma.', 422);
        }

        Redis::srem("room:{$roomId}:players", $ghostId);

        $base = "room:{$roomId}:player:{$ghostId}";
        Redis::del([
            "{$base}:info",
            "{$base}:stats",
            "{$base}:turn_state",
            "{$base}:perks",
            "{$base}:hand",
            "{$base}:card_usage",
        ]);
    }

    // =========================================================================
    // Crear jugador fantasma
    // =========================================================================

    public function spawnGhost(string $roomId, array $ghostData): array
    {
        if ((int) Redis::scard("room:{$roomId}:players") >= self::MAX_PLAYERS) {
            throw new \Exception(
                'La sala ya tiene el máximo de ' . self::MAX_PLAYERS . ' jugadores.',
                422
            );
        }

        $this->validateRoleSlot($roomId, $ghostData['role']);

        do {
            // Genera un número aleatorio entre 1 millón y 9 millones
            $ghostId = random_int(1000000, 9999999);
        } while (Redis::sismember("room:{$roomId}:players", (string) $ghostId));
        $base    = "room:{$roomId}:player:{$ghostId}";

        Redis::hmset("{$base}:info", [
            'user_id'     => $ghostId,
            'username'    => $ghostData['username'],
            'role'        => $ghostData['role'],
            'stress'      => 0,
            'acting_boss' => 0,
            'is_online'   => 1,
            'is_dead'     => 0,
            'killer_name' => '',
            'is_guest'    => 0,
            'is_ghost'    => 1,
        ]);

        Redis::hmset("{$base}:stats", [
            'damage_dealt'    => 0,
            'damage_received' => 0,
            'healing_done'    => 0,
            'cards_played'    => 0,
            'passives_played' => 0,
            'eliminations'    => 0,
            'dodged_attacks'  => 0,
            'cards_stolen'    => 0,
        ]);

        Redis::hmset("{$base}:turn_state", [
            'skip_next_turn'               => 0,
            'single_attack_used_this_turn' => 0,
            'multi_attack_used_this_turn'  => 0,
            'must_discard'                 => 0,
        ]);

        Redis::hmset("{$base}:perks", [
            'has_shield'   => 0,
            'has_storage'  => 0,
            'has_luck'     => 0,
            'has_distance' => 0,
            'is_blocked'   => 0,
            'vision_bonus' => 0,
        ]);

        Redis::set("{$base}:hand", json_encode([]));
        Redis::hmset("{$base}:card_usage", ['initialized' => 1]);

        foreach ([':info', ':stats', ':turn_state', ':perks', ':hand', ':card_usage'] as $suffix) {
            Redis::expire("{$base}{$suffix}", 86400);
        }

        Redis::sadd("room:{$roomId}:players", $ghostId);

        return [
            'id'       => $ghostId,
            'username' => $ghostData['username'],
            'role'     => $ghostData['role'],
        ];
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    /**
     * Verifica que quede un hueco disponible para el rol dado.
     *
     * @param string|null $excludePlayerId  Si se indica, ese jugador no se cuenta
     *                                      en el conteo (útil al cambiar el rol propio).
     */
    private function validateRoleSlot(
        string $roomId,
        string $role,
        ?string $excludePlayerId = null
    ): void {
        $counts = array_fill_keys(array_keys(self::ROLE_LIMITS), 0);

        foreach (Redis::smembers("room:{$roomId}:players") as $pid) {
            $pid = (string) $pid;
            if ($pid === $excludePlayerId) continue;

            $playerRole = Redis::hget("room:{$roomId}:player:{$pid}:info", 'role');
            if ($playerRole && array_key_exists($playerRole, $counts)) {
                $counts[$playerRole]++;
            }
        }

        $limit = self::ROLE_LIMITS[$role] ?? 0;

        if ($counts[$role] >= $limit) {
            throw new \Exception(
                "Ya existe el máximo de jugadores con rol '{$role}' (límite: {$limit}).",
                422
            );
        }
    }
}
