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
    protected $targetName;
    protected $sabotageId;

    public function __construct(string $roomId, string $targetName, string $sabotageId)
    {
        $this->roomId = $roomId;
        $this->targetName = $targetName;
        $this->sabotageId = $sabotageId;
    }

    public function handle(GameReactionService $reactionService): void
    {
        $turnStateKey = "room:{$this->roomId}:player:{$this->targetName}:turn_state";

        // Verificar que el jugador sigue teniendo obligación de descartar
        $mustDiscard = Redis::hget($turnStateKey, 'must_discard');
        if ($mustDiscard != 1) {
            return; // Ya descartó manualmente o se limpió
        }

        // Verificar que este es el Job correcto
        $currentSabotageId = Redis::hget($turnStateKey, 'sabotage_id');
        if ($currentSabotageId !== $this->sabotageId) {
            Log::info("ResolveSabotageJob.php - Ignorando sabotaje fantasma/obsoleto para {$this->targetName}");
            return; // Es un Job viejo de un ataque anterior
        }

        $handKey = "room:{$this->roomId}:player:{$this->targetName}:hand";
        $cards = json_decode(Redis::get($handKey) ?: '[]', true);

        if (!empty($cards)) {
            // Seleccionar una carta al azar
            $randomCard = $cards[array_rand($cards)];

            // Usar el servicio para resolver el sabotaje automáticamente
            $reactionService->resolveSabotage($this->roomId, $this->targetName, $randomCard['id'] ?? null);

            Log::info("ResolveSabotageJob.php - Descarte automático realizado en {$this->roomId} para {$this->targetName}");
            event(new RoomStateUpdated($this->roomId));
        } else {
            // Caso raro: Si el jugador se quedó con 0 cartas de alguna otra forma, simplemente limpiar el estado
            Redis::hset($turnStateKey, 'must_discard', 0);
            Redis::hdel($turnStateKey, 'sabotage_id'); 

            // Limpiar el pending global si coincide
            $pendingSabotageTarget = Redis::get("room:{$this->roomId}:pending_sabotage");
            if ($pendingSabotageTarget === $this->targetName) {
                Redis::del("room:{$this->roomId}:pending_sabotage");
            }
        }
    }
}
