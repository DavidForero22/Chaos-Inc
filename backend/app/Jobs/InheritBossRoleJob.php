<?php

namespace App\Jobs;

use App\Services\LiveGame\DisconnectionService;
use App\Services\LiveGame\GameFinalizationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Redis;

class InheritBossRoleJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly string $roomId,
    ) {}

    public function handle(
        DisconnectionService $disconnectionService,
        GameFinalizationService $finalizationService
    ): void {
        $ttl       = Redis::ttl("room:{$this->roomId}:boss_grace_period");
        $actingTtl = Redis::ttl("room:{$this->roomId}:acting_boss_grace_period");

        fwrite(STDOUT, "InheritBossRoleJob: TTL boss={$ttl} acting={$actingTtl}\n");

        if ($ttl > 1 || $actingTtl >= 1) {
            fwrite(STDOUT, "InheritBossRoleJob: grace period activa, abortando.\n");
            return;
        }

        $players = Redis::smembers("room:{$this->roomId}:players");
        foreach ($players as $name) {
            if (Redis::hget("room:{$this->roomId}:player:{$name}", 'acting_boss') === '1') {
                fwrite(STDOUT, "InheritBossRoleJob: acting_boss ya existe en {$name}, comprobando victoria.\n");
                $finalizationService->checkDisconnectionVictory($this->roomId);
                return;
            }
        }

        fwrite(STDOUT, "InheritBossRoleJob: heredando cargo.\n");
        $disconnectionService->inheritBossRole($this->roomId);

        // Tras heredar, comprobar si la partida tiene condición de victoria
        $finalizationService->checkDisconnectionVictory($this->roomId);
    }
}
