<?php
// app/Http/Controllers/Lobby/LiveRoomController.php

namespace App\Http\Controllers\Lobby;

use App\Http\Controllers\Controller;
use App\Http\Requests\Room\JoinRoomRequest;
use App\Http\Requests\Room\KickPlayerRequest;
use App\Jobs\ProcessDisconnectionJob;
use App\Services\Lobby\LiveRoomService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;

class LiveRoomController extends Controller
{
    protected $liveRoomService;

    public function __construct(LiveRoomService $liveRoomService)
    {
        $this->liveRoomService = $liveRoomService;
    }

    public function join(JoinRoomRequest $request, $id)
    {
        try {
            $user = $request->user();
            $playerName = $user->username;

            $result = $this->liveRoomService->joinRoom($id, $playerName, $request->input('password'));

            return response()->json($result, 200);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], $e->getCode() ?: 400);
        }
    }

    public function leave(Request $request, $id)
    {

        Log::info("BEACON RECIBIDO", [
            'room' => $id,
            'game_token_header' => $request->header('X-Game-Token'),
            'game_token_query' => $request->query('game_token'),
            'user' => $request->user()?->username,
            'all' => $request->all(),
        ]);

        $gameToken = $request->header('X-Game-Token')
            ?? $request->input('game_token')
            ?? $request->query('game_token');

        // Identificar al jugador por game_token (cubre sendBeacon sin sesión)
        $playerNameFromRedis = $gameToken
            ? Redis::get("room:{$id}:token:{$gameToken}")
            : null;

        if ($playerNameFromRedis) {
            // Ruta beacon: identidad verificada por game_token en Redis
            $playerName = $playerNameFromRedis;
        } else {
            // Ruta normal: verificar sesión Sanctum
            $user = $request->user();
            if (!$user) {
                return response()->json(['error' => 'Unauthenticated.'], 401);
            }
            $playerName = $user->username;
        }

        $this->liveRoomService->leaveRoom($id, $playerName);

        $roomStatus = Redis::hget("room:{$id}:state", "status");
        if ($roomStatus !== 'in_game') {
            Redis::del("room:{$id}:token:{$gameToken}");
        }

        return response()->json(['message' => 'Action processed successfully.'], 200);
    }

    public function kick(KickPlayerRequest $request, $id)
    {
        $user = $request->user();
        $gameToken = $request->header('X-Game-Token')
            ?? $request->input('game_token')
            ?? $request->query('game_token');

        // Validar que el que intenta echar sea quien dice ser
        $adminNameFromRedis = Redis::get("room:{$id}:token:{$gameToken}");

        if (!$adminNameFromRedis || $adminNameFromRedis !== $user->username) {
            return response()->json(['error' => 'Unauthorized action.'], 403);
        }

        $playerToKick = $request->input('player_to_kick');

        // El servicio se encarga de verificar si $user->username es el líder de la sala
        $this->liveRoomService->kickPlayer($id, $user->username, $playerToKick);

        return response()->json(['message' => 'Player kicked successfully.'], 200);
    }

    public function reportDisconnect(string $roomId, Request $request)
    {
        $targetPlayerId = $request->input('disconnected_player_id');
        $targetPlayerName = $request->input('disconnected_player_name');

        // Preguntar a Reverb usando el ID real
        $pusher = Broadcast::driver()->getPusher();
        $channelName = "presence-room.{$roomId}";

        $isSocketAlive = false;
        try {
            $response = $pusher->get_users_info($channelName);
            $isSocketAlive = collect($response->users ?? [])->contains('id', $targetPlayerId);
        } catch (\Exception $e) {
            $isSocketAlive = false;
        }

        if ($isSocketAlive) {
            return response()->json(['status' => 'ignored', 'reason' => 'player_still_connected']);
        }

        // Control de spam en Redis usando el Nombre
        $disconnectKey = "room:{$roomId}:disconnecting:{$targetPlayerName}";

        if (!Redis::exists($disconnectKey)) {
            Redis::setex($disconnectKey, 10, 'pending');

            // Pasar ambos datos al Job
            ProcessDisconnectionJob::dispatch($roomId, $targetPlayerId, $targetPlayerName)
                ->delay(now()->addSeconds(4));
        }

        return response()->json(['status' => 'pending_grace_period']);
    }
}
