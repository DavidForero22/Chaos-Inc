<?php
// app/Jobs/CheckVictoryJob.php

namespace App\Jobs;

use App\Services\Game\Status\GameFinalizationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Redis;

class CheckVictoryJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly string $roomId,
        private readonly string $token
    ) {}

    public function handle(GameFinalizationService $finalizationService): void
    {
        // Obtenemos el token actual que hay en Redis
        $currentToken = Redis::get("room:{$this->roomId}:ending_grace_period");

        // Si la llave no existe, o si el token es DISTINTO al de este Job, abortamos.
        // Esto evita que un Job viejo ejecute la victoria de una desconexión nueva.
        if ($currentToken !== $this->token) {
            return;
        }

        // Si llegamos aquí, somos el Job legítimo. Borramos la llave y ganamos.
        Redis::del("room:{$this->roomId}:ending_grace_period");
        $finalizationService->finalizeVictory($this->roomId);
    }
}
