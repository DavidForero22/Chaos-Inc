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
        $roomKey = "room:{$this->roomId}";

        // Si la sala ya no existe, el Job muere
        if (!Redis::exists($roomKey)) return;

        $currentTurnPlayer = Redis::hget($roomKey, 'current_turn_player_id');
        $currentTurnId = Redis::hget($roomKey, 'current_turn_id');

        // ¿Sigue siendo su turno y no ha reiniciado el contador (mismo turnId)?
        if ($currentTurnPlayer === $this->playerName && $currentTurnId === $this->turnId) {
            Redis::del("{$roomKey}:pending_attack");

            // Si estaba sufriendo un sabotaje (must_discard), quitarlo para no bloquearle el siguiente turno
            if (Redis::exists("{$roomKey}:pending_sabotage")) {
                $playerKey = "{$roomKey}:player:{$this->playerName}";
                Redis::hset($playerKey, 'must_discard', 0);
                Redis::hdel($playerKey, 'must_discard_by');
                Redis::del("{$roomKey}:pending_sabotage");
            }

            $handService->enforceHandLimit($this->roomId, $this->playerName);
            $turnService->advanceTurn($this->roomId);

            $mensaje = "El tiempo de {$this->playerName} se ha agotado.";
            event(new RoomStateUpdated($this->roomId, $mensaje));
        }
    }
}
