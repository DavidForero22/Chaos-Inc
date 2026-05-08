<?php
// app/Jobs/AutoEndTurnJob.php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Redis;
use App\Services\Game\Engine\TurnService;
use App\Events\RoomStateUpdated;
use Illuminate\Support\Facades\Log;

class AutoEndTurnJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public string $roomId,
        public string $playerId,
        public string $turnId
    ) {}

    /**
     * Execute the job.
     */
    public function handle(
        TurnService $turnService,
        \App\Services\Game\Engine\PlayerHandService $handService
    ): void {
        $roomStateKey = "room:{$this->roomId}:state";

        // Si el estado de la sala ya no existe, terminar
        if (!Redis::exists($roomStateKey)) {
            return;
        }

        $currentTurnPlayerId = Redis::hget($roomStateKey, 'current_turn_player_id');
        $currentTurnId       = Redis::hget($roomStateKey, 'current_turn_id');

        // ¿Sigue siendo su turno y no ha reiniciado el contador (mismo turnId)?
        if (
            $currentTurnPlayerId === $this->playerId &&
            $currentTurnId === $this->turnId
        ) {

            Redis::del("room:{$this->roomId}:pending_attack");

            // Si estaba sufriendo un sabotaje (must_discard), quitarlo para no bloquearle el siguiente turno
            if (Redis::exists("room:{$this->roomId}:pending_sabotage")) {

                $playerTurnStateKey = "room:{$this->roomId}:player:{$this->playerId}:turn_state";

                Redis::hset($playerTurnStateKey, 'must_discard', 0);
                Redis::hdel($playerTurnStateKey, 'sabotage_id');

                Redis::del("room:{$this->roomId}:pending_sabotage");
            }

            $handService->enforceHandLimit($this->roomId, $this->playerId);

            // Obtener username para logs/eventos
            $playerName = Redis::hget(
                "room:{$this->roomId}:player:{$this->playerId}:info",
                'username'
            ) ?? $this->playerId;

            $turnService->advanceTurn($this->roomId);

            Log::info("AutoEndTurnJob.php:: Saltando automáticamente el turno de {$playerName}");

            $mensaje = __('game.time_out', [
                'player' => $playerName
            ]);

            event(new RoomStateUpdated($this->roomId, $mensaje));
        }
    }
}
