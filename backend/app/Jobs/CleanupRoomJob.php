<?php
// app/Jobs/CleanupRoomJob.php

namespace App\Jobs;

use App\Events\RoomListUpdated;
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

        // Verificar si la sala aún existe antes de borrar
        if (!Redis::exists("room:{$this->roomId}")) {
            Log::info( "CleanupRoomJob.php: La sala {$this->roomId} ya no existe, saltando.\n");
            return;
        }

        Log::info( "CleanupRoomJob.php: Borrando datos de la sala {$this->roomId}");

        $playerNames = Redis::smembers("room:{$this->roomId}:players");
        $finalizationService->cleanupRedis($this->roomId, $playerNames);
        event(new RoomListUpdated($this->roomId));
        Log::info( "CleanupRoomJob.php: Sala {$this->roomId} eliminada y lista de salas actualizada.\n");
    }
}
