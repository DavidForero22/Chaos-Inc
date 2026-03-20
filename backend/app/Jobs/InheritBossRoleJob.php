<?php
// app/Jobs/InheritBossRoleJob.php

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

        // Si la partida ya está terminando por abandono, no heredar nada.
        if (
            Redis::hget("room:{$this->roomId}", 'game_over') === '1' ||
            Redis::exists("room:{$this->roomId}:ending_grace_period")
        ) {
            fwrite(STDOUT, "InheritBossRoleJob: Partida terminando, abortando herencia.\n");
            return;
        }

        $hasBossGrace = Redis::exists("room:{$this->roomId}:boss_grace_period");
        $hasActingGrace = Redis::exists("room:{$this->roomId}:acting_boss_grace_period");

        // Si las llaves no   existen, es porque el jugador se reconectó
        if (!$hasBossGrace && !$hasActingGrace) {
            fwrite(STDOUT, "InheritBossRoleJob: No hay llaves de gracia (jugador reconectado o ya procesado), abortando.\n");
            return;
        }

        Redis::del("room:{$this->roomId}:boss_grace_period");
        Redis::del("room:{$this->roomId}:acting_boss_grace_period");

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
