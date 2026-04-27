<?php
// app/Jobs/CleanupRoomJob.php

namespace App\Jobs;

use App\Services\Game\Status\GameFinalizationService;
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
        protected string $roomId
    ) {}

    public function handle(GameFinalizationService $finalizationService): void
    {
        // Validamos la existencia antes de actuar
        if (!Redis::exists("room:{$this->roomId}:state")) {
            Log::info("CleanupRoomJob: La sala {$this->roomId} ya no existe o ya fue limpiada.");
            return;
        }

        $finalizationService->destroyRoom($this->roomId);
    }
}
