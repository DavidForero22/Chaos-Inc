<?php
// app/Jobs/CleanupRoomJob.php

namespace App\Jobs;

use App\Services\Game\Status\GameFinalizationService;
use App\Support\RoomLogger;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;

class CleanupRoomJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        protected string $roomId,
        protected string $cleanupToken
    ) {}

    public function handle(GameFinalizationService $finalizationService): void
    {
        $roomStateKey = "room:{$this->roomId}:state";

        // Validar la existencia antes de actuar
        if (!Redis::exists($roomStateKey)) {
            RoomLogger::info($this->roomId, "CleanupRoomJob.php: La sala ya no existe o ya fue limpiada.");
            return;
        }

        // Verificar que es el Job autorizado
        $currentCleanupToken = Redis::hget($roomStateKey, 'cleanup_token');
        if ($currentCleanupToken !== $this->cleanupToken) {
            RoomLogger::info($this->roomId, "CleanupRoomJob.php: Ignorado. Job zombie o token no coincide.");
            return;
        }

        $finalizationService->destroyRoom($this->roomId);
    }
}
