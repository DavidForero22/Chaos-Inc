<?php

namespace App\Services;

use App\Events\RoomStateUpdated;
use App\Events\GameStarted; // <-- Asegúrate de haber ejecutado: php artisan make:event GameStarted
use Exception;
use Illuminate\Support\Facades\Redis;

class LiveGameService
{
    public function startGame(string $roomId, string $requestingPlayer): void
    {
        $roomKey = "room:{$roomId}";

        if (!Redis::exists($roomKey)) {
            throw new Exception("La sala no existe.", 404);
        }

        $room = Redis::hgetall($roomKey);

        if ($room['owner_name'] !== $requestingPlayer) {
            throw new Exception("Solo el líder puede iniciar la partida.", 403);
        }

        $players = Redis::smembers("{$roomKey}:players");
        if (count($players) < 2) {
            throw new Exception("No hay suficientes jugadores.", 400);
        }

        // 1. CAMBIAR ESTADO DE LA SALA
        Redis::hset($roomKey, 'status', 'in_game');

        // 2. REPARTO DE ROLES
        shuffle($players);
        $roles = ['boss'];
        for ($i = 1; $i < count($players); $i++) {
            $roles[] = 'employee';
        }

        $bossPlayerName = '';

        // 3. INICIALIZAR JUGADORES EN REDIS Y ASIGNAR CARTAS
        $testDeck = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]; // Mazo un poco más grande
        shuffle($testDeck);

        foreach ($players as $index => $playerName) {
            $playerRole = $roles[$index];
            if ($playerRole === 'boss') {
                $bossPlayerName = $playerName;
            }

            $playerCards = array_splice($testDeck, 0, 3);

            $playerData = [
                'role' => $playerRole,
                'stress' => 0,
                'is_dead' => 0,
                'cards' => json_encode($playerCards)
            ];

            Redis::hmset("room:{$roomId}:player:{$playerName}", $playerData);
            Redis::expire("room:{$roomId}:player:{$playerName}", 86400);
        }

        // Guardar estado global de la partida
        Redis::hset($roomKey, 'current_turn_player_id', $bossPlayerName);
        Redis::set("room:{$roomId}:turn_order", json_encode($players));
        Redis::expire("room:{$roomId}:turn_order", 86400);

        // Guardar mazo restante
        Redis::set("room:{$roomId}:deck", json_encode($testDeck));
        Redis::expire("room:{$roomId}:deck", 86400);

        // 4. AVISAR A TODOS
        event(new RoomStateUpdated());
        event(new GameStarted($roomId));
    }

    // MÉTODO PARA EL ENDPOINT DE SINCRONIZACIÓN
    public function getPlayerData(string $roomId, string $playerName): array
    {
        $playerKey = "room:{$roomId}:player:{$playerName}";

        if (!Redis::exists($playerKey)) {
            throw new Exception("Datos de jugador no encontrados.", 404);
        }

        $data = Redis::hgetall($playerKey);

        // Decodificamos las cartas para enviarlas como array
        $data['cards'] = json_decode($data['cards']);

        // Obtenemos info general de la sala para sincronizar (ej: de quién es el turno)
        $room = Redis::hgetall("room:{$roomId}");
        $data['current_turn'] = $room['current_turn_player_id'] ?? null;

        $players = Redis::smembers("room:{$roomId}:players");
        $publicPlayers = [];

        foreach ($players as $pName) {
            $pData = Redis::hgetall("room:{$roomId}:player:{$pName}");
            $publicPlayers[] = [
                'name' => $pName,
                'stress' => $pData['stress'] ?? 0,
                'is_dead' => $pData['is_dead'] ?? 0,
                // Si es el boss, se avisa. Si no, se oculta el rol.
                'role' => ($pData['role'] === 'boss') ? 'boss' : 'hidden'
            ];
        }

        $data['players_info'] = $publicPlayers;

        return $data;
    }
}
