<?php

namespace App\Jobs;

use App\Services\LiveGame\DisconnectionService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;

class InheritBossRoleJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly string $roomId,
    ) {}

    public function handle(DisconnectionService $disconnectionService): void
    {
        $ttl        = Redis::ttl("room:{$this->roomId}:boss_grace_period");
        $actingTtl  = Redis::ttl("room:{$this->roomId}:acting_boss_grace_period");

        fwrite(STDOUT, "InheritBossRoleJob: TTL boss={$ttl} acting={$actingTtl}\n");

        if ($ttl > 1 || $actingTtl > 1) {
            fwrite(STDOUT, "InheritBossRoleJob: grace period activa, abortando.\n");
            return;
        }

        $players = Redis::smembers("room:{$this->roomId}:players");
        foreach ($players as $name) {
            if (Redis::hget("room:{$this->roomId}:player:{$name}", 'acting_boss') === '1') {
                fwrite(STDOUT, "InheritBossRoleJob: acting_boss ya existe en {$name}, abortando.\n");
                return;
            }
        }

        fwrite(STDOUT, "InheritBossRoleJob: heredando cargo.\n");
        $disconnectionService->inheritBossRole($this->roomId);
    }
}
