<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

class ActingBossGracePeriodStarted implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(
        private readonly string $playerName,
    ) {}

    public function broadcastOn(): Channel
    {
        return new PrivateChannel("player.{$this->playerName}");
    }

    public function broadcastAs(): string
    {
        return 'ActingBossGracePeriodStarted';
    }

    public function broadcastWith(): array
    {
        return [];
    }
}
