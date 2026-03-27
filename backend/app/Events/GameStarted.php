<?php
// app/Events/GameStarted.php

namespace App\Events;

use Illuminate\Broadcasting\PresenceChannel; 
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class GameStarted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $roomId;

    public function __construct(string $roomId)
    {
        $this->roomId = $roomId;
    }

    public function broadcastOn(): array
    {
        return [
            new PresenceChannel('room.' . $this->roomId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'GameStarted';
    }
}