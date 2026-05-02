<?php

namespace App\Jobs;

use App\Services\Game\Status\DisconnectionService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Broadcast;

class ProcessDisconnectionJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public string $roomId,
        public int|string $playerId,
        public string $playerName
    ) {}

    public function handle(DisconnectionService $disconnectionService): void
    {
        $disconnectKey = "room:{$this->roomId}:disconnecting:{$this->playerName}";

        // Preguntar a Reverb con el ID
        $pusher = Broadcast::driver()->getPusher();
        $channelName = "presence-room.{$this->roomId}";

        $isSocketAlive = false;
        try {
            $response = $pusher->get_users_info($channelName);
            $isSocketAlive = collect($response->users ?? [])->contains('id', $this->playerId);
        } catch (\Exception $e) {
            $isSocketAlive = false;
        }

        if ($isSocketAlive) {
            // Falsa alarma, gue un F5 rápido. 
            Redis::del($disconnectKey);
            return;
        }

        // Si sigue muerto, desconexión real usando el Nombre
        $disconnectionService->processInGameDisconnection($this->roomId, $this->playerName);
        Redis::del($disconnectKey);
    }
}
