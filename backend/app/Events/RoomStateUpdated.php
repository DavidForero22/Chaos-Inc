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
    public ?array $achievementsUnlocked;
    public ?string $playerDrewExtraCard;
    public ?string $kickedPlayerId;

    public function __construct(
        string $roomId,
        ?string $logMessage = null,
        ?array $cardAction = null,
        ?array $achievementsUnlocked = null,
        ?string $playerDrewExtraCard = null,
        ?string $kickedPlayerId = null
    ) {
        $this->roomId = $roomId;
        $this->logMessage = $logMessage;
        $this->cardAction = $cardAction;
        $this->achievementsUnlocked = $achievementsUnlocked;
        $this->playerDrewExtraCard = $playerDrewExtraCard;
        $this->kickedPlayerId = $kickedPlayerId;
    }

    public function broadcastWith(): array
    {
        return [
            'roomId'                    => $this->roomId,
            'log_message'               => $this->logMessage,
            'card_action'               => $this->cardAction,
            'achievement_notifications' => $this->achievementsUnlocked,
            'player_drew_extra_card'    => $this->playerDrewExtraCard,
            'kicked_player_id'          => $this->kickedPlayerId,
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
