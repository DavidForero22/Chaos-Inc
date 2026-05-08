<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Redis;
use App\Events\RoomStateUpdated;
use App\Services\Game\Actions\GameReactionService;
use Illuminate\Support\Facades\Log;

class ResolveSabotageJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $roomId;
    protected $targetId;
    protected $sabotageId;

    public function __construct(string $roomId, string $targetId, string $sabotageId)
    {
        $this->roomId = $roomId;
        $this->targetId = $targetId;
        $this->sabotageId = $sabotageId;
    }

    public function handle(GameReactionService $reactionService): void
    {
        $turnStateKey = "room:{$this->roomId}:player:{$this->targetId}:turn_state";

        // Verificar que el jugador sigue teniendo obligación de descartar
        $mustDiscard = Redis::hget($turnStateKey, 'must_discard');
        if ($mustDiscard != 1) {
            return; // Ya descartó manualmente o se limpió
        }

        $playerName = Redis::hget(
            "room:{$this->roomId}:player:{$this->targetId}:info",
            'username'
        );

        // Verificar que este es el Job correcto
        $currentSabotageId = Redis::hget($turnStateKey, 'sabotage_id');
        if ($currentSabotageId !== $this->sabotageId) {
            Log::info("ResolveSabotageJob.php - Ignorando sabotaje fantasma/obsoleto para {$playerName}");
            return;
        }

        $handKey = "room:{$this->roomId}:player:{$this->targetId}:hand";
        $cards = json_decode(Redis::get($handKey) ?: '[]', true);

        if (!empty($cards)) {

            // Seleccionar una carta al azar
            $randomCard = $cards[array_rand($cards)];

            // Resolver sabotaje automático usando ID
            $reactionService->resolveSabotage(
                $this->roomId,
                $this->targetId,
                $randomCard['id'] ?? null
            );

            Log::info("ResolveSabotageJob.php - Descarte automático realizado en {$this->roomId} para {$playerName}");

            event(new RoomStateUpdated($this->roomId));
        } else {

            // Caso raro: sin cartas
            Redis::hset($turnStateKey, 'must_discard', 0);
            Redis::hdel($turnStateKey, 'sabotage_id');

            // Limpiar pending global si coincide
            $pendingSabotageTarget = Redis::get("room:{$this->roomId}:pending_sabotage");

            if ($pendingSabotageTarget === $this->targetId) {
                Redis::del("room:{$this->roomId}:pending_sabotage");
            }
        }
    }
}
