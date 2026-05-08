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
    protected $playerId;
    protected $challengeId;

    public function __construct(string $roomId, string $playerId, string $challengeId)
    {
        $this->roomId = $roomId;
        $this->playerId = $playerId;
        $this->challengeId = $challengeId;
    }

    public function handle(TurnService $turnService): void
    {
        $challengeKey = "room:{$this->roomId}:luck_challenge:{$this->playerId}";

        $challengeDataStr = Redis::get($challengeKey);

        $playerName = Redis::hget(
            "room:{$this->roomId}:player:{$this->playerId}:info",
            'username'
        );

        // Si la key no existe, el jugador ya respondió y el sistema limpió la key.
        if (!$challengeDataStr) {
            Log::info("ResolveLuckChallengeJob.php - Ignorado: {$playerName} ya respondió o la partida terminó.");
            return;
        }

        $challengeData = json_decode($challengeDataStr, true);

        // Verificar que este Job pertenece a este minijuego exacto
        if (($challengeData['challenge_id'] ?? '') !== $this->challengeId) {
            Log::info("ResolveLuckChallengeJob.php - Ignorado: Job obsoleto o fantasma para {$playerName}.");
            return;
        }

        // Si llega aquí, es el Job legítimo y el jugador no ha respondido a tiempo.
        Redis::del($challengeKey);

        Log::info("ResolveLuckChallengeJob.php - Tiempo agotado para {$playerName} en {$this->roomId}. Saltando turno.");

        $msg = __('game.luckyFailTimeout', ['player' => $playerName]);
        event(new RoomStateUpdated($this->roomId, $msg));

        $turnService->advanceTurn($this->roomId);
    }
}
