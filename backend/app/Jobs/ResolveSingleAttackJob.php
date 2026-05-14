<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Redis;
use App\Events\RoomStateUpdated;
use App\Services\Game\Engine\CombatService;
use App\Support\RoomLogger;
use Illuminate\Support\Facades\Log;

class ResolveSingleAttackJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $roomId;
    protected $attackerId;
    protected $targetId;
    protected $attackToken;

    public function __construct(string $roomId, string $attackerId, string $targetId, string $attackToken)
    {
        $this->roomId = $roomId;
        $this->attackerId = $attackerId;
        $this->targetId = $targetId;
        $this->attackToken = $attackToken;
    }

    public function handle(CombatService $combatService): void
    {
        $pendingKey = "room:{$this->roomId}:pending_attack";
        $pendingAttack = Redis::hgetall($pendingKey);

        // Si ya no hay ataque pendiente, no hacer nada
        if (empty($pendingAttack)) {
            return;
        }

        // Comprobar si el token coincide
        if (($pendingAttack['attack_token'] ?? '') !== $this->attackToken) {
            RoomLogger::info($this->roomId, "ResolveSingleAttackJob.php: Ignorado Job zombie. Este ataque individual ya pasó.");
            return;
        }

        $playerName = Redis::hget(
            "room:{$this->roomId}:player:{$this->targetId}:info",
            'username'
        );

        // El jugador no respondió a tiempo. Entra el daño.
        RoomLogger::info($this->roomId, "ResolveSingleAttackJob.php: Daño automático aplicado a {$playerName}.");
        $combatService->applyDamageAndCheck(
            $this->roomId,
            $this->attackerId,
            $this->targetId
        );

        // Limpiamos el estado
        Redis::del($pendingKey);

        event(new RoomStateUpdated(
            $this->roomId,
            __("game.attack_auto_resolved", ['player' => $playerName])
        ));
    }
}
