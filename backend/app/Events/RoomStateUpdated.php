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

    public $message;

    public function __construct(string $message = 'El estado de las salas ha cambiado')
    {
        $this->message = $message;
    }

    public function broadcastOn(): array
    {
        // Se emite al canal global "lobby" para que el MainMenu lo escuche
        return [
            new Channel('lobby'),
        ];
    }

    // Le decimos a Laravel Echo cómo se llama exactamente el evento (para no tener que usar App\Events\...)
    public function broadcastAs(): string
    {
        return 'RoomStateUpdated';
    }
}
