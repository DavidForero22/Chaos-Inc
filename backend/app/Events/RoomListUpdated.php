<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RoomListUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $roomId;

    public function __construct(string $roomId)
    {
        $this->roomId = $roomId;
    }

    public function broadcastOn(): array
    {
        // Se emite a un canal específico de la sala, ej: "room.AB12CD"
        return [
            new Channel('lobby'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'RoomListUpdated';
    }
}
