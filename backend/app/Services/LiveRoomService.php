<?php

namespace App\Services;

use App\Events\RoomListUpdated;
use App\Events\RoomStateUpdated;
use App\Exceptions\GameException;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class LiveRoomService
{
    public function joinRoom(string $roomId, string $playerName, ?string $password = null): array
    {
        $roomKey = "room:{$roomId}";

        if (!Redis::exists($roomKey)) {
            throw new GameException(GameException::ROOM_NOT_FOUND, "The room does not exist.", 404);
        }

        $room = Redis::hgetall($roomKey);

        // Generar un Token Único de Partida
        $gameToken = (string) Str::uuid();

        // Si ya está en la sala (refrescó la página)
        if (Redis::sismember("{$roomKey}:players", $playerName)) {
            Redis::setex("room:{$roomId}:token:{$gameToken}", 86400, $playerName);
            return [
                'message' => "You're already in this room",
                'room_id' => $roomId,
                'player' => $playerName,
                'game_token' => $gameToken 
            ];
        }

        if ($room['status'] !== 'waiting') {
            throw new GameException(GameException::GAME_ALREADY_STARTED, "The game has already begun.", 403);
        }

        if ($room['is_private'] === '1') {
            if (!$password) {
                throw new GameException(GameException::PASSWORD_REQUIRED, "Password required.", 403);
            }

            if (!Hash::check($password, $room['password'])) {
                throw new GameException(GameException::INCORRECT_PASSWORD, "Incorrect password.", 403);
            }
        }

        $currentPlayersCount = Redis::scard("{$roomKey}:players");
        if ($currentPlayersCount >= $room['max_players']) {
            throw new GameException(GameException::ROOM_FULL, "The room is full.", 409);
        }

        // Añadir jugador
        Redis::sadd("{$roomKey}:players", $playerName);

        // Guardar el token en Redis
        Redis::setex("room:{$roomId}:token:{$gameToken}", 86400, $playerName);

        event(new RoomListUpdated($roomId));
        event(new RoomStateUpdated());

        return [
            'message' => 'You have joined the room.',
            'room_id' => $roomId,
            'player' => $playerName,
            'game_token' => $gameToken // <-- DEVOLVEMOS EL TOKEN
        ];
    }

    public function leaveRoom(string $roomId, string $playerName): void
    {
        $roomKey = "room:{$roomId}";
        $room = Redis::hgetall($roomKey);

        if (empty($room)) {
            throw new GameException(GameException::ROOM_NOT_FOUND, "The room with ID {$roomId} does not exist.", 404);
        }

        if (!Redis::sismember("{$roomKey}:players", $playerName)) {
            throw new GameException(GameException::NOT_IN_ROOM, "Player {$playerName} is not in this room.", 409);
        }

        // Eliminar al usuario de la sala
        Redis::srem("{$roomKey}:players", $playerName);
        $remainingPlayers = Redis::scard("{$roomKey}:players");

        // Si no quedan jugadores, borrar sala
        if ($remainingPlayers === 0) {
            Redis::del($roomKey);
            Redis::del("{$roomKey}:players");
            Redis::srem("active_rooms", $roomId);
        } 

        event(new RoomListUpdated($roomId));
        event(new RoomStateUpdated());
    }

    public function kickPlayer(string $roomId, string $adminName, string $playerToKick): void
    {
        $roomKey = "room:{$roomId}";
        $room = Redis::hgetall($roomKey);

        if (empty($room)) {
            throw new GameException(GameException::ROOM_NOT_FOUND, "The room does not exist.", 404);
        }

        // Validar que el que ejecuta la acción es el dueño
        if ($room['owner_name'] !== $adminName) {
            throw new GameException(GameException::NOT_LEADER, "Only the room owner can kick players.", 403);
        }

        // Validar que no se expulse a sí mismo
        if ($adminName === $playerToKick) {
            throw new GameException(GameException::CANNOT_KICK_SELF, "You cannot kick yourself.", 400);
        }

        // Validar que el jugador a expulsar esté en la sala
        if (!Redis::sismember("{$roomKey}:players", $playerToKick)) {
            throw new GameException(GameException::NOT_IN_ROOM, "The player is not in the room.", 404);
        }

        // --- Expulsar ---
        Redis::srem("{$roomKey}:players", $playerToKick);

        // Notificar a todos los canales 
        event(new RoomListUpdated($roomId));
        event(new RoomStateUpdated());
    }
}
