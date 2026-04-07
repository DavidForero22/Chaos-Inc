<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Redis;
use App\Services\Game\Engine\TurnService;
use App\Events\RoomStateUpdated;

class AutoEndTurnJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public string $roomId,
        public string $playerName,
        public string $turnId
    ) {}

    /**
     * Execute the job.
     */
    public function handle(TurnService $turnService, \App\Services\Game\Engine\PlayerHandService $handService): void
    {
        $roomStateKey = "room:{$this->roomId}:state";

        // Si el estado de la sala ya no existe, terminar
        if (!Redis::exists($roomStateKey)) return;

        $currentTurnPlayer = Redis::hget($roomStateKey, 'current_turn_player_id');
        $currentTurnId = Redis::hget($roomStateKey, 'current_turn_id');

        // ¿Sigue siendo su turno y no ha reiniciado el contador (mismo turnId)?
        if ($currentTurnPlayer === $this->playerName && $currentTurnId === $this->turnId) {

            Redis::del("room:{$this->roomId}:pending_attack");

            // Si estaba sufriendo un sabotaje (must_discard), quitarlo para no bloquearle el siguiente turno
            if (Redis::exists("room:{$this->roomId}:pending_sabotage")) {

                $playerTurnStateKey = "room:{$this->roomId}:player:{$this->playerName}:turn_state";

                Redis::hset($playerTurnStateKey, 'must_discard', 0);
                Redis::hdel($playerTurnStateKey, 'must_discard_by');

                Redis::del("room:{$this->roomId}:pending_sabotage");
            }

            $handService->enforceHandLimit($this->roomId, $this->playerName);
            $turnService->advanceTurn($this->roomId);

            $mensaje = "El tiempo de {$this->playerName} se ha agotado.";
            event(new RoomStateUpdated($this->roomId, $mensaje));
        }
    }
}
