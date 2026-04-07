<?php
// app/Jobs/InheritBossRoleJob.php

namespace App\Jobs;

use App\Services\Game\Engine\TurnService;
use App\Services\Game\Status\DisconnectionService;
use App\Services\Game\Status\GameFinalizationService;
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

    public function handle(
        DisconnectionService $disconnectionService,
        GameFinalizationService $finalizationService,
        TurnService $turnService
    ): void {

        $roomStateKey = "room:{$this->roomId}:state";

        // Si la partida ya está terminando por abandono, no heredar nada.
        if (
            Redis::hget($roomStateKey, 'game_over') === '1' ||
            Redis::exists("room:{$this->roomId}:ending_grace_period")
        ) {
            Log::info("InheritBossRoleJob: Partida terminando en $this->roomId, abortando herencia.\n");
            return;
        }

        $hasBossGrace = Redis::exists("room:{$this->roomId}:boss_grace_period");
        $hasActingGrace = Redis::exists("room:{$this->roomId}:acting_boss_grace_period");

        // Si las llaves no existen, es porque el jugador se reconectó
        if (!$hasBossGrace && !$hasActingGrace) {
            Log::info("InheritBossRoleJob.php: No hay llaves de gracia (jugador reconectado o ya procesado) en sala $this->roomId, abortando.\n");
            return;
        }

        Redis::del("room:{$this->roomId}:boss_grace_period");
        Redis::del("room:{$this->roomId}:acting_boss_grace_period");

        $players = Redis::smembers("room:{$this->roomId}:players");
        foreach ($players as $name) {
            if (Redis::hget("room:{$this->roomId}:player:{$name}:info", 'acting_boss') === '1') {
                Log::info("InheritBossRoleJob.php: acting_boss ya existe en {$name} en sala $this->roomId, comprobando victoria.\n");
                $finalizationService->checkDisconnectionVictory($this->roomId);
                return;
            }
        }

        Log::info("InheritBossRoleJob.php: heredando cargo en la sala $this->roomId.\n");
        $disconnectionService->inheritBossRole($this->roomId);

        // Tras heredar, comprobar si la partida tiene condición de victoria
        $finalizationService->checkDisconnectionVictory($this->roomId);

        // Si el check de victoria no ha destruido la sala ni marcado game_over
        if (Redis::exists($roomStateKey) && Redis::hget($roomStateKey, 'game_over') !== '1') {
            Log::info("InheritBossRoleJob.php: Reactivando el temporizador de turno en sala $this->roomId tras herencia.");
            $turnService->resumeTurnTimer($this->roomId);
            event(new \App\Events\RoomStateUpdated($this->roomId));
        }
    }
}
