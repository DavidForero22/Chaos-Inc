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
use Illuminate\Support\Facades\Log;

class ResolveSingleAttackJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $roomId;
    protected $attackerName;
    protected $targetName;

    public function __construct(string $roomId, string $attackerName, string $targetName)
    {
        $this->roomId = $roomId;
        $this->attackerName = $attackerName;
        $this->targetName = $targetName;
    }

    public function handle(CombatService $combatService): void
    {
        $pendingKey = "room:{$this->roomId}:pending_attack";
        $pendingAttack = Redis::hgetall($pendingKey);

        // Si ya no hay ataque pendiente o es para otro objetivo, no hacemos nada
        if (empty($pendingAttack) || $pendingAttack['target'] !== $this->targetName) {
            return;
        }

        // El jugador no respondió a tiempo. Entra el daño.
        Log::info("ResolveSingleAttackJob.php - Daño automático aplicado en {$this->roomId} a {$this->targetName}");

        $combatService->applyDamageAndCheck($this->roomId, $this->attackerName, $this->targetName);

        // Limpiamos el estado
        Redis::del($pendingKey);

        event(new RoomStateUpdated($this->roomId, __("game.attack_auto_resolved", ['target' => $this->targetName])));
    }
}
