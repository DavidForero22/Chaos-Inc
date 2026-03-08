<?php

namespace App\Services\LiveGame;

use App\Models\User;
use App\Services\GameService;
use Illuminate\Support\Facades\Redis;

class GameFinalizationService
{
    public function __construct(protected GameService $gameService) {}

    public function finalize(string $roomId): void
    {
        $roomKey     = "room:{$roomId}";
        $room        = Redis::hgetall($roomKey);
        $playerNames = Redis::smembers("{$roomKey}:players");

        $winnerRole        = $room['winner_role'] ?? null;
        $totalRounds       = (int) ($room['round_number'] ?? 0);
        $totalEliminations = 0;

        $winningRoles = match ($winnerRole) {
            'boss'  => ['boss', 'secretary'],
            'union' => ['union'],
            'intern' => ['intern'],
            default => [],
        };

        $playersData   = [];
        $playerUserIds = [];

        foreach ($playerNames as $name) {
            $pData = Redis::hgetall("{$roomKey}:player:{$name}");
            $role  = $pData['role'] ?? 'intern';
            $elims = (int) ($pData['eliminations'] ?? 0);
            $totalEliminations += $elims;

            // Buscar usuario registrado por nombre (guests no tienen registro)
            $user = User::where('username', $name)->first();
            if (!$user) continue;

            $playerUserIds[] = $user->id;
            $playersData[]   = [
                'user_id'         => $user->id,
                'has_won'         => in_array($role, $winningRoles),
                'role'            => $role,
                'damage_dealt'    => (int) ($pData['damage_dealt']    ?? 0),
                'damage_received' => (int) ($pData['damage_received'] ?? 0),
                'cards_played'    => (int) ($pData['cards_played']    ?? 0),
                'eliminations'    => $elims,
            ];
        }

        // Guardar en DB solo si hay jugadores registrados
        if (!empty($playersData)) {
            $this->gameService->createGame([
                'winner_role'        => $winnerRole,
                'total_rounds'       => $totalRounds,
                'total_eliminations' => $totalEliminations,
                'players'            => $playersData,
            ]);
        }

        // Iniciar la limpieza "perezosa"
        $this->cleanupRedis($roomId, $playerNames);
    }

    private function cleanupRedis(string $roomId, array $playerNames): void
    {
        $roomKey = "room:{$roomId}";
        $expireTime = 60;

        // Poner fecha de caducidad a todas las llaves de la sala
        foreach ($playerNames as $name) {
            Redis::expire("{$roomKey}:player:{$name}", $expireTime);
        }

        // Tokens de la sala
        $tokenKeys = Redis::keys("{$roomKey}:token:*");
        foreach ($tokenKeys as $key) {
            Redis::expire($key, $expireTime);
        }

        Redis::expire("{$roomKey}:deck", $expireTime);
        Redis::expire("{$roomKey}:turn_order", $expireTime);
        Redis::expire("{$roomKey}:pending_attack", $expireTime);
        Redis::expire("{$roomKey}:players", $expireTime);

        // Expirar la llave principal de la sala
        Redis::expire($roomKey, $expireTime);

        // La unica llave que se borra al instante es la de "active_rooms"
        Redis::srem("active_rooms", $roomId);
    }
}
