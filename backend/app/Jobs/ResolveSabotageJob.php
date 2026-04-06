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

    public function __construct(string $roomId, string $targetName)
    {
        $this->roomId = $roomId;
        $this->targetName = $targetName;
    }

    public function handle(GameReactionService $reactionService): void
    {
        $pendingSabotageTarget = Redis::get("room:{$this->roomId}:pending_sabotage");

        // Si ya no hay sabotaje pendiente o es para otra persona, no hacer nada (ya descartó manualmente)
        if ($pendingSabotageTarget !== $this->targetName) {
            return;
        }

        $handKey = "room:{$this->roomId}:player:{$this->targetName}:hand";
        $cards = json_decode(Redis::get($handKey) ?: '[]', true);

        if (!empty($cards)) {
            // Seleccionar una carta al azar
            $randomCard = $cards[array_rand($cards)];

            // Usar el servicio para resolver el sabotaje automáticamente
            $reactionService->resolveSabotage($this->roomId, $this->targetName, $randomCard['id'] ?? null);

            Log::info("ResolveSabotageJob.php - Descarte automático realizado en {$this->roomId} para {$this->targetName}");
            event(new RoomStateUpdated($this->roomId)); // Nota: quité una coma extra que tenías aquí
        } else {
            // Caso raro: Si el jugador se quedó con 0 cartas de alguna otra forma simplemente limpiar el estado
            $turnStateKey = "room:{$this->roomId}:player:{$this->targetName}:turn_state";

            Redis::hset($turnStateKey, 'must_discard', 0);
            Redis::hdel($turnStateKey, 'must_discard_by');
            Redis::del("room:{$this->roomId}:pending_sabotage");
        }
    }
}
