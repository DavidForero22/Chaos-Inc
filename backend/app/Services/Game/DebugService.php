<?php

namespace App\Services\Game;

use App\Events\RoomStateUpdated;
use App\Jobs\CleanupRoomJob;
use App\Services\Game\Engine\TurnService;
use App\Services\Game\Status\GameFinalizationService;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;

class DebugService
{
    public function __construct(
        protected TurnService $turnService,
        protected GameFinalizationService $finalizationService
    ) {}


    private const MAX_STRESS = [
        'boss'      => 5,
        'secretary' => 4,
        'intern'    => 4,
        'union'     => 4,
    ];

    // =========================================================================
    // Punto de entrada principal
    // =========================================================================

    public function processDebugAction(string $roomId, array $data): array
    {
        $playerId = (string) $data['player_id'];
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
                $data['room_actions']
            );
        }

        event(new RoomStateUpdated($roomId, "El sistema ha modificado la partida (Debug)."));

        return $applied;
    }

    // =========================================================================
    // Modificaciones del jugador
    // =========================================================================

    private function processPlayerModifications(string $roomId, string $playerId, array $mods): void
    {
        if (array_key_exists('set_stress', $mods)) {
            $this->setStress($roomId, $playerId, (int) $mods['set_stress']);
        }

        if (!empty($mods['add_cards'])) {
            $this->addCardsToPlayer($roomId, $playerId, $mods['add_cards']);
        }

        if (array_key_exists('set_is_dead', $mods)) {
            $this->setIsDead($roomId, $playerId, (bool) $mods['set_is_dead']);
        }
    }

    private function setIsDead(string $roomId, string $playerId, bool $isDead): void
    {
        $infoKey = "room:{$roomId}:player:{$playerId}:info";
        Redis::hset($infoKey, 'is_dead', $isDead ? '1' : '0');

        // Comprobar si la modificación ha provocado una victoria
        $hasWon = $this->finalizationService->checkAndFinalizeVictory($roomId);

        // Si nadie ganó, el jugador que modificó acaba de morir y además era su turno, saltarlo
        if (!$hasWon && $isDead) {
            $currentTurnPlayerId = Redis::hget("room:{$roomId}:state", 'current_turn_player_id');

            if ($currentTurnPlayerId === $playerId) {
                $this->turnService->advanceTurn($roomId);
            }
        }
    }

    private function setStress(string $roomId, string $playerId, int $stress): void
    {
        $infoKey = "room:{$roomId}:player:{$playerId}:info";
        $role    = Redis::hget($infoKey, 'role') ?? 'union';
        $max     = (self::MAX_STRESS[$role] ?? 4) - 1;

        Redis::hset($infoKey, 'stress', max(0, min($stress, $max)));
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

                $cardArray['id']      = (string) Str::uuid();
                $cardArray['card_id'] = (int) $cardId;
                $cardArray['name']    = $cardArray['display_name'] ?? $cardArray['base_name'];

                $hand[] = $cardArray;
            }
        }

        Redis::set($handKey, json_encode(array_values($hand)));
    }

    // =========================================================================
    // Acciones de sala
    // =========================================================================

    private function processRoomActions(string $roomId, array $actions): array
    {
        $results = [];

        if (isset($actions['force_win'])) {
            $this->forceWin($roomId, $actions['force_win']);
            $results['force_win'] = $actions['force_win'];
        }

        return $results;
    }

    private function forceWin(string $roomId, string $outcome): void
    {
        // Forzar el estado de la partida en Redis (incluyendo el rol ganador)
        Redis::hmset("room:{$roomId}:state", [
            'game_over'   => 1,
            'winner_role' => $outcome === 'cancelled' ? '' : $outcome,
            'status'      => 'finished',
        ]);

        // Manejar el caso de cancelación (sin logros ni estadísticas)
        if ($outcome === 'cancelled') {
            $message = "La partida ha sido cancelada por el sistema.";
            event(new RoomStateUpdated($roomId, $message));

            $cleanupToken = uniqid('cleanup_', true);
            Redis::hset("room:{$roomId}:state", 'cleanup_token', $cleanupToken);
            CleanupRoomJob::dispatch($roomId, $cleanupToken)->delay(now('UTC')->addSeconds(7));

            return;
        }

        $this->finalizationService->finalize($roomId);
    }
}
