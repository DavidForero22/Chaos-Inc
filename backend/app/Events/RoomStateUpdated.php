<?php
// app/Events/RoomStateUpdated.php

namespace App\Events;

use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RoomStateUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public string $roomId;
    public ?string $logMessage;
    public ?array $cardAction;
    public ?array $achievement;

    public function __construct(string $roomId, ?string $logMessage = null, ?array $cardAction = null, ?array $achievement = null)
    {
        $this->roomId = $roomId;
        $this->logMessage = $logMessage;
        $this->cardAction = $cardAction;
        $this->achievement = $achievement;
    }

    public function broadcastWith(): array
    {
        return [
            'roomId'      => $this->roomId,
            'log_message' => $this->logMessage, // Para avisos del sistema (conexiones, etc)
            'card_action' => $this->cardAction, // [ 'card_id' => 1, 'source' => 'Pepe', 'target' => 'Juan' ]
            'achievement' => $this->achievement,
        ];
    }

    public function broadcastOn(): array
    {
        return [new PresenceChannel('room.' . $this->roomId)];
    }

    public function broadcastAs(): string
    {
        return 'RoomStateUpdated';
    }
}
