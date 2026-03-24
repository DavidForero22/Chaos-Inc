<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Redis;
use App\Events\RoomStateUpdated;
use App\Services\Game\Engine\TurnService;
use Illuminate\Support\Facades\Log;

class ResolveLuckChallengeJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $roomId;
    protected $playerName;

    public function __construct(string $roomId, string $playerName)
    {
        $this->roomId = $roomId;
        $this->playerName = $playerName;
    }

    public function handle(TurnService $turnService): void
    {
        $challengeKey = "room:{$this->roomId}:luck_challenge:{$this->playerName}";

        // Si la clave ya no existe, es que el jugador respondió a tiempo
        if (!Redis::exists($challengeKey)) {
            return;
        }

        Log::info("ResolveLuckChallengeJob.php - Tiempo agotado para {$this->playerName} en {$this->roomId}");

        // Forzamos el fallo
        Redis::del($challengeKey);

        // Mensaje de que se quedó dormido en la reunión
        $msg = __('game.luckyFailTimeout', ['player' => $this->playerName]);
        event(new RoomStateUpdated($this->roomId, $msg));

        // Pasamos el turno al siguiente
        $turnService->advanceTurn($this->roomId);
    }
}
