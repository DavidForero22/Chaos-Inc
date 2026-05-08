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
        $disconnectKey = "room:{$this->roomId}:disconnecting:{$this->playerId}";

        // Canal de presencia 
        $pusher = Broadcast::driver()->getPusher();
        $channelName = "presence-room.{$this->roomId}";

        $isSocketAlive = false;

        try {
            $response = $pusher->get_users_info($channelName);

            $isSocketAlive = collect($response->users ?? [])
                ->contains('id', $this->playerId);
        } catch (\Exception $e) {
            $isSocketAlive = false;
        }

        if ($isSocketAlive) {
            // Falsa alarma (F5 rápido o reconexión inmediata)
            Redis::del($disconnectKey);
            return;
        }

        // Desconexión real
        // OJO: la lógica interna todavía usa playerName porque el resto del sistema aún depende de ello
        $disconnectionService->processInGameDisconnection($this->roomId, $this->playerId);

        Redis::del($disconnectKey);
    }
}
