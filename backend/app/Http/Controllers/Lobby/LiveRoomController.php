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
            $result = $this->liveRoomService->joinRoom($id, (string) $user->id, $user->username, $request->input('password'));

            return response()->json($result, 200);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], $e->getCode() ?: 400);
        }
    }

    public function leave(Request $request, $id)
    {
        $gameToken = $request->header('X-Game-Token')
            ?? $request->input('game_token')
            ?? $request->query('game_token');

        $playerIdFromRedis = $gameToken
            ? Redis::get("room:{$id}:token:{$gameToken}")
            : null;

        if ($playerIdFromRedis) {
            $playerId = $playerIdFromRedis;
        } else {
            $user = $request->user();
            if (!$user) {
                return response()->json(['error' => 'Unauthenticated.'], 401);
            }
            $playerId = (string) $user->id;
        }

        // El servicio se encarga de buscar el nombre para el Log interno si lo necesita
        $this->liveRoomService->leaveRoom($id, $playerId);

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

        $adminIdFromRedis = Redis::get("room:{$id}:token:{$gameToken}");

        if (!$adminIdFromRedis || (string) $adminIdFromRedis !== (string) $user->id) {
            return response()->json(['error' => 'Unauthorized action.'], 403);
        }

        $playerToKickId = $request->input('player_to_kick_id');

        $this->liveRoomService->kickPlayer($id, (string) $user->id, (string) $playerToKickId);

        return response()->json(['message' => 'Player kicked successfully.'], 200);
    }

    public function reportDisconnect(string $roomId, Request $request)
    {
        $targetPlayerId = (string) $request->input('disconnected_player_id');
        $targetPlayerName = $request->input('disconnected_player_name');

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

        // Control de spam en Redis 
        $disconnectKey = "room:{$roomId}:disconnecting:{$targetPlayerId}";

        if (!Redis::exists($disconnectKey)) {
            Redis::setex($disconnectKey, 10, 'pending');

            ProcessDisconnectionJob::dispatch($roomId, $targetPlayerId, $targetPlayerName)
                ->delay(now()->addSeconds(4));
        }

        return response()->json(['status' => 'pending_grace_period']);
    }
}
