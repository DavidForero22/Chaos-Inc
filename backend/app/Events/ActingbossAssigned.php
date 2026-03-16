<?php
// app/Events/ActingBossAssigned.php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

class ActingBossAssigned implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(
        private readonly string $playerName,
    ) {}

    /**
     * Canal privado exclusivo del jugador ascendido.
     * El resto de jugadores no reciben este evento.
     */
    public function broadcastOn(): Channel
    {
        return new PrivateChannel("player.{$this->playerName}");
    }

    public function broadcastAs(): string
    {
        return 'ActingBossAssigned';
    }

    /**
     * Sin payload — el frontend solo necesita saber que ES él.
     * No se envía ningún nombre para evitar fugas de información.
     */
    public function broadcastWith(): array
    {
        return [];
    }
}
