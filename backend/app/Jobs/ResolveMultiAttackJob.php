<?php

namespace App\App\Jobs;

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

        // Si el ataque se resolvió antes (todos respondieron)
        if (empty($pending) || empty($pending['targets'])) {
            return;
        }

        // Evitar ejecución de jobs obsoletos
        if (($pending['attack_token'] ?? '') !== $this->attackToken) {
            Log::info("ResolveMultiAttackJob.php - Ignorado Job zombie en {$this->roomId}. Este ataque ya pasó.");
            return;
        }

        $attackerId = $pending['attacker'];

        // Aplicar daño a los que no respondieron (usando IDs)
        foreach ($pending['targets'] as $targetId) {
            $combatService->applyDamageAndCheck($this->roomId, $attackerId, $targetId);
        }

        // --- TRADUCCIÓN DE IDs A NOMBRES PARA EL LOG ---
        $getName = function ($id) {
            return Redis::hget("room:{$this->roomId}:player:{$id}:info", 'username') ?? "Sujeto #{$id}";
        };

        $attackerName = $getName($attackerId);

        $dodgerNames = array_map($getName, $pending['dodgers'] ?? []);
        $shielderNames = array_map($getName, $pending['shielders'] ?? []);
        $hitNames = array_map($getName, $pending['targets']);

        $allTargetNames = array_merge($hitNames, $dodgerNames, $shielderNames);

        // --- CONSTRUCCIÓN DEL LOG ---
        $logMessage = __('game.attacked_all', [
            'attacker' => $attackerName,
            'targets'  => implode(', ', $allTargetNames),
        ]);

        if (!empty($dodgerNames)) {
            $logMessage .= ' ' . __('game.multi_dodged', [
                'dodgers' => implode(', ', $dodgerNames)
            ]);
        }

        if (!empty($shielderNames)) {
            $logMessage .= ' ' . __('game.shields_broken', [
                'shielders' => implode(', ', $shielderNames)
            ]);
        }

        // Limpiar Redis después de procesar
        Redis::del("room:{$this->roomId}:pending_multi_attack");

        $turnService->resumeTurnTimer($this->roomId);

        Log::info("ResolveMultiAttackJob.php - Ataque multiple de {$attackerName} finalizado en {$this->roomId}");

        event(new RoomStateUpdated($this->roomId, $logMessage));
    }
}
