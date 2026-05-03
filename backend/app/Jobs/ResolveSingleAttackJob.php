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
    protected $attackToken;

    public function __construct(string $roomId, string $attackerName, string $targetName, string $attackToken)
    {
        $this->roomId = $roomId;
        $this->attackerName = $attackerName;
        $this->targetName = $targetName;
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
            Log::info("ResolveSingleAttackJob.php - Ignorado Job zombie en {$this->roomId}. Este ataque individual ya pasó.");
            return;
        }

        // El jugador no respondió a tiempo. Entra el daño.
        Log::info("ResolveSingleAttackJob.php - Daño automático aplicado en {$this->roomId} a {$this->targetName}");

        $combatService->applyDamageAndCheck($this->roomId, $this->attackerName, $this->targetName);

        // Limpiamos el estado
        Redis::del($pendingKey);

        event(new RoomStateUpdated($this->roomId, __("game.attack_auto_resolved", ['player' => $this->targetName])));
    }
}
