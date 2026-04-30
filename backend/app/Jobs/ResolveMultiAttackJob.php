<?php

namespace App\Jobs;

use App\Events\RoomStateUpdated;
use App\Services\Game\Engine\CombatService;
use App\Services\Game\Engine\TurnService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;

class ResolveMultiAttackJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly string $roomId,
        private readonly string $attackToken
    ) {}

    public function handle(CombatService $combatService, TurnService $turnService): void
    {
        $pendingStr = Redis::get("room:{$this->roomId}:pending_multi_attack");
        $pending = json_decode($pendingStr ?? 'null', true);

        // Si el ataque se resolvió rápido porque todos respondieron antes de los 15s,
        // esto estará vacío y el job termina silenciosamente sin hacer nada.
        if (empty($pending) || empty($pending['targets'])) {
            return;
        }

        // Comprobar si es un Job antiguo
        if (($pending['attack_token'] ?? '') !== $this->attackToken) {
            Log::info("ResolveMultiAttackJob.php - Ignorado Job zombie en {$this->roomId}. Este ataque ya pasó.");
            return;
        }

        // Aplicar daño a los que no respondieron
        foreach ($pending['targets'] as $target) {
            $combatService->applyDamageAndCheck($this->roomId, $pending['attacker'], $target);
        }

        Redis::del("room:{$this->roomId}:pending_multi_attack");

        // Construir log final
        $dodgers   = $pending['dodgers'] ?? [];
        $shielders = $pending['shielders'] ?? [];

        // En el mensaje general, juntar a todos los que sufrieron el ataque de una forma u otra
        $allTargets = array_merge($pending['targets'], $dodgers, $shielders);

        $logMessage = __('game.attacked_all', [
            'attacker' => $pending['attacker'],
            'targets'  => implode(', ', $allTargets),
        ]);

        if (!empty($dodgers)) {
            $logMessage .= ' ' . __('game.multi_dodged', ['dodgers' => implode(', ', $dodgers)]);
        }

        if (!empty($shielders)) {
            $logMessage .= ' ' . __('game.shields_broken', ['shielders' => implode(', ', $shielders)]);
        }

        $turnService->resumeTurnTimer($this->roomId);
        Log::info("ResolveMultiAttackJob.php - Ataque multiple finalizado en {$this->roomId}");
        event(new RoomStateUpdated($this->roomId, $logMessage));
    }
}
