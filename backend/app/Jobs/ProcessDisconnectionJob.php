<?php

namespace App\Jobs;

use App\Services\Game\Status\DisconnectionService;
use App\Services\Lobby\LiveRoomService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Log;

class ProcessDisconnectionJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public string $roomId,
        public int|string $playerId,
    ) {}

    public function handle(
        DisconnectionService $disconnectionService,
        LiveRoomService $liveRoomService
    ): void {
        $disconnectKey = "room:{$this->roomId}:disconnecting:{$this->playerId}";

        // Canal de presencia 
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
            // Falsa alarma (F5 rápido o reconexión inmediata)
            Redis::del($disconnectKey);
            return;
        }

        // Desconexión real comprobada
        $roomStateKey = "room:{$this->roomId}:state";
        $status = Redis::hget($roomStateKey, 'status');


        if ($status === 'waiting') {
            // --- ESTÁ EN EL LOBBY ---
            Redis::del("player:{$this->playerId}:room");

            Log::info("ProcessDisconnectionJob.php - Se ha desconectado automáticamente al usuario con ID $this->playerId en la sala $this->roomId (sala de espera)");

            $liveRoomService->leaveRoom($this->roomId, $this->playerId);
        } else {
            // --- ESTÁ EN PARTIDA ---
            Log::info("ProcessDisconnectionJob.php - Se ha desconectado automáticamente al usuario con ID $this->playerId en la sala $this->roomId (partida en curso)");
            $disconnectionService->processInGameDisconnection($this->roomId, $this->playerId);
        }

        Redis::del($disconnectKey);
    }
}
