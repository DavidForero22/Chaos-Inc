<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RoomStateUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $roomId;

    public function __construct(string $roomId)
    {
        $this->roomId = $roomId;
    }

    public function broadcastOn(): array
    {
        // SOLO enviamos el evento a los que están dentro de esta sala
        return [
            new Channel('room.' . $this->roomId),
        ];
    }

    // Le decimos a Laravel Echo cómo se llama exactamente el evento (para no tener que usar App\Events\...)
    public function broadcastAs(): string
    {
        return 'RoomStateUpdated';
    }
}
