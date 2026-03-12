<?php
// app/Services/LiveRoomService.php

namespace App\Services;

use App\Events\RoomListUpdated;
use App\Events\RoomStateUpdated;
use App\Exceptions\GameException;
use App\Exceptions\RoomException;
use App\Services\LiveGame\LiveGameService;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class LiveRoomService
{
    public function joinRoom(string $roomId, string $playerName, ?string $password = null): array
    {
        $roomKey = "room:{$roomId}";

        if (!Redis::exists($roomKey)) {
            throw new RoomException(RoomException::ROOM_NOT_FOUND, "The room does not exist.", 404);
        }

        $room = Redis::hgetall($roomKey);

        // Validar contraseña si no estamos ya en la sala
        $alreadyInRoom = Redis::sismember("{$roomKey}:players", $playerName);

        // Verificar que el jugador no este en mas de una sala
        if (!$alreadyInRoom) {
            $activeRooms = Redis::smembers("active_rooms");
            foreach ($activeRooms as $activeRoomId) {
                if ($activeRoomId !== $roomId) {
                    $isInOtherRoom = Redis::sismember("room:{$activeRoomId}:players", $playerName);
                    if ($isInOtherRoom) {
                        throw new RoomException(
                            RoomException::ALREADY_IN_ANOTHER_ROOM,
                            "You are already in another game. Finish or quit the current one first.",
                            403
                        );
                    }
                }
            }
        }

        if (!$alreadyInRoom && $room['is_private'] === '1') {
            if (!$password) {
                throw new RoomException(RoomException::PASSWORD_REQUIRED, "Password required.", 403);
            }
            if (!Hash::check($password, $room['password'])) {
                throw new RoomException(RoomException::INCORRECT_PASSWORD, "Incorrect password.", 403);
            }
        }

        // Si el juego está en curso y NO estás en la sala, error
        if (!$alreadyInRoom && $room['status'] === 'in_game') {
            throw new GameException(GameException::GAME_ALREADY_STARTED, "The game has already begun.", 403);
        }

        if (!$alreadyInRoom) {
            $currentPlayersCount = Redis::scard("{$roomKey}:players");
            if ($currentPlayersCount >= $room['max_players']) {
                throw new RoomException(RoomException::ROOM_FULL, "The room is full.", 409);
            }

            Redis::sadd("{$roomKey}:players", $playerName);

            // Avisamos al Lobby (hay un jugador más) y a la Sala (actualicen sus listas)
            event(new RoomListUpdated($roomId));
            event(new RoomStateUpdated($roomId));
        } else if ($room['status'] === 'in_game') {
            $playerKey = "room:{$roomId}:player:{$playerName}";

            // Verificar si realmente se había caído antes de clavarle la penalización
            $wasOffline = Redis::hget($playerKey, 'is_online') === '0';

            // Volver a ponerlo online
            Redis::hset($playerKey, 'is_online', 1);

            if ($wasOffline) {
                Redis::hset($playerKey, 'skip_next_turn', 1);
            }

            event(new RoomStateUpdated($roomId));
        }

        // Borrar token antiguo para limpieza y seguridad
        $prefix = config('database.redis.options.prefix', '');
        $existingTokens = Redis::keys("room:{$roomId}:token:*");
        
        foreach ($existingTokens as $key) {
            $cleanKey = str_replace($prefix, '', $key);
            if (Redis::get($cleanKey) === $playerName) {
                Redis::del($cleanKey);
            }
        }

        $gameToken = (string) Str::uuid();
        Redis::setex("room:{$roomId}:token:{$gameToken}", 86400, $playerName);

        return [
            'message' => $alreadyInRoom ? 'Reconnected.' : 'Joined.',
            'room_id' => $roomId,
            'player' => $playerName,
            'game_token' => $gameToken
        ];
    }

    public function leaveRoom(string $roomId, string $playerName): void
    {
        $roomKey = "room:{$roomId}";
        $room = Redis::hgetall($roomKey);

        if (empty($room)) {
            throw new RoomException(RoomException::ROOM_NOT_FOUND, "The room with ID {$roomId} does not exist.", 404);
        }

        if (!Redis::sismember("{$roomKey}:players", $playerName)) {
            throw new RoomException(RoomException::NOT_IN_ROOM, "Player {$playerName} is not in this room.", 409);
        }

        // ABANDONO VS DESCONEXIÓN
        if ($room['status'] === 'in_game') {
            // Si la partida ya empezó, marcar al jugador offline
            Redis::hset("room:{$roomId}:player:{$playerName}", 'is_online', 0);
            app(LiveGameService::class)->checkAndAdvanceTurnOnDisconnect($roomId, $playerName);
            event(new RoomStateUpdated($roomId));
            return;
        }

        // --- BORRADO DE JUGADOR ---
        Redis::srem("{$roomKey}:players", $playerName);
        $this->deletePlayerToken($roomId, $playerName);

        $remainingPlayersCount = Redis::scard("{$roomKey}:players");

        // --- BORRADO DE SALA VACIA ---
        if ($remainingPlayersCount === 0) {
            $this->deleteAllRoomData($roomId);
            Redis::srem("active_rooms", $roomId);
        } else {
            // Si el que se va es el dueño, pasar la corona a otro jugador
            if ($room['owner_name'] === $playerName) {
                $newOwner = Redis::srandmember("{$roomKey}:players");
                if ($newOwner) {
                    Redis::hset($roomKey, 'owner_name', $newOwner);
                }
            }
        }

        event(new RoomListUpdated($roomId));

        // Si la sala se borró, no disparar el evento StateUpdated porque ya no existe
        if ($remainingPlayersCount > 0) {
            event(new RoomStateUpdated($roomId));
        }
    }

    public function kickPlayer(string $roomId, string $adminName, string $playerToKick): void
    {
        $roomKey = "room:{$roomId}";
        $room = Redis::hgetall($roomKey);

        if (empty($room)) {
            throw new RoomException(RoomException::ROOM_NOT_FOUND, "The room does not exist.", 404);
        }

        // Validar que el que ejecuta la acción es el dueño
        if ($room['owner_name'] !== $adminName) {
            throw new RoomException(RoomException::NOT_LEADER, "Only the room owner can kick players.", 403);
        }

        // Validar que no se expulse a sí mismo
        if ($adminName === $playerToKick) {
            throw new RoomException(RoomException::CANNOT_KICK_SELF, "You cannot kick yourself.", 422);
        }

        // Validar que el jugador a expulsar esté en la sala
        if (!Redis::sismember("{$roomKey}:players", $playerToKick)) {
            throw new RoomException(RoomException::NOT_IN_ROOM, "The player is not in the room.", 404);
        }

        // --- Expulsar y Limpiar ---
        Redis::srem("{$roomKey}:players", $playerToKick);

        $this->deletePlayerToken($roomId, $playerToKick);

        event(new RoomListUpdated($roomId));
        event(new RoomStateUpdated($roomId));
    }

    // --- FUNCIONES AUXILIARES ---

    /**
     * Busca el token de un jugador concreto en Redis y lo borra.
     */
    private function deletePlayerToken(string $roomId, string $playerName): void
    {
        $prefix = config('database.redis.options.prefix', '');
        $tokenKeys = Redis::keys("room:{$roomId}:token:*");

        foreach ($tokenKeys as $key) {
            $cleanKey = str_replace($prefix, '', $key);
            $tokenOwner = Redis::get($cleanKey);

            if ($tokenOwner === $playerName) {
                Redis::del($cleanKey);
                break; 
            }
        }
    }

    /**
     * Borra todos los datos relaccionados a una sala en Redis.
     */
    private function deleteAllRoomData(string $roomId): void
    {
        $prefix = config('database.redis.options.prefix', '');
        $allRoomKeys = Redis::keys("room:{$roomId}*");

        if (!empty($allRoomKeys)) {
            $cleanKeys = array_map(fn($key) => str_replace($prefix, '', $key), $allRoomKeys);
            Redis::del($cleanKeys);
        }
    }
}
