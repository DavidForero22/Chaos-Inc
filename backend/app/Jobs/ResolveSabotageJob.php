<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Redis;
use App\Events\RoomStateUpdated;
use App\Services\Game\Engine\PlayerHandService;
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

    public function handle(PlayerHandService $handService): void
    {
        $pendingSabotageTarget = Redis::get("room:{$this->roomId}:pending_sabotage");

        // Si ya no hay sabotaje pendiente o es para otra persona, no hacemos nada (ya descartó manualmente)
        if ($pendingSabotageTarget !== $this->targetName) {
            return;
        }

        $playerKey = "room:{$this->roomId}:player:{$this->targetName}";

        // Obtenemos las cartas actuales del jugador
        $cards = json_decode(Redis::hget($playerKey, 'cards') ?: '[]', true);

        if (!empty($cards)) {
            // Seleccionar una carta al azar
            $randomCard = $cards[array_rand($cards)];

            // Usar el servicio para resolver el sabotaje automáticamente
            // (Asumimos que el atacante ya no importa mucho aquí, o puedes pasar "Sistema" como atacante)
            $handService->resolveSabotage($this->roomId, $this->targetName, $randomCard['id'] ?? null);

            Log::info("ResolveSabotageJob.php - Descarte automático realizado en {$this->roomId} para {$this->targetName}");
            event(new RoomStateUpdated($this->roomId,));
        } else {
            // Caso raro: Si el jugador se quedó con 0 cartas de alguna otra forma (ej. otro evento simultáneo)
            // Simplemente limpiamos el estado.
            Redis::hset($playerKey, 'must_discard', 0);
            Redis::hdel($playerKey, 'must_discard_by');
            Redis::del("room:{$this->roomId}:pending_sabotage");
        }
    }
}
