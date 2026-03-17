<?php

namespace App\Jobs;

use App\Services\LiveGame\GameFinalizationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Redis;

class CheckVictoryJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly string $roomId,
    ) {}

    public function handle(GameFinalizationService $finalizationService): void
    {
        // Si ya no existe la key, alguien se reconectó — no hacer nada
        if (!Redis::exists("room:{$this->roomId}:ending_grace_period")) {
            return;
        }

        Redis::del("room:{$this->roomId}:ending_grace_period");
        $finalizationService->finalizeVictory($this->roomId);
    }
}
