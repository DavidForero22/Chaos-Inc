<?php

namespace App\Jobs;

use App\Events\RoomStateUpdated;
use App\Services\Game\Actions\GameActionService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Redis;

class ResolveMultiAttackJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly string $roomId,
    ) {}

    public function handle(GameActionService $gameActionService): void
    {
        $pending = json_decode(Redis::get("room:{$this->roomId}:pending_multi_attack") ?? 'null', true);

        if (empty($pending) || empty($pending['targets'])) {
            return; 
        }

        // Aplicar daño a los que no respondieron
        foreach ($pending['targets'] as $target) {
            $gameActionService->applyDamageAndCheck($this->roomId, $pending['attacker'], $target);
        }

        Redis::del("room:{$this->roomId}:pending_multi_attack");

        // Construir log final
        $dodgers = $pending['dodgers'] ?? [];
        $logMessage = __('game.attacked_all', [
            'attacker' => $pending['attacker'],
            'targets'  => implode(', ', array_merge($pending['targets'], $dodgers)),
        ]);

        if (!empty($dodgers)) {
            $logMessage .= ' ' . __('game.multi_dodged', ['dodgers' => implode(', ', $dodgers)]);
        }

        event(new RoomStateUpdated($this->roomId, $logMessage));
    }
}
