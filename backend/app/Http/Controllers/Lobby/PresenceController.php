<?php
// app/Http/Controllers/Lobby/PresenceController.php

namespace App\Http\Controllers\Lobby;

use App\Http\Controllers\Controller;
use App\Services\Lobby\PresenceService;
use Illuminate\Http\Request;

class PresenceController extends Controller
{
    public function __construct(
        protected PresenceService $presenceService,
    ) {}

    public function markOffline(Request $request, string $id): \Illuminate\Http\JsonResponse
    {
        $user = $request->user();
        $status = $this->presenceService->markOffline($id, $user->username);

        return response()->json(['status' => $status]);
    }

    public function reportDisconnect(Request $request, string $id): \Illuminate\Http\JsonResponse
    {
        $disconnectedPlayer = $request->input('disconnected_player');

        if (!$disconnectedPlayer) {
            return response()->json(['error' => 'Missing player'], 400);
        }

        $status = $this->presenceService->processDisconnectReport($id, $disconnectedPlayer);

        return response()->json(['status' => $status]);
    }

    public function reportLobbyDisconnect(Request $request, string $id): \Illuminate\Http\JsonResponse
    {
        $disconnectedPlayer = $request->input('disconnected_player');

        if (!$disconnectedPlayer) {
            return response()->json(['error' => 'Missing player'], 400);
        }

        $status = $this->presenceService->processLobbyDisconnectReport($id, $disconnectedPlayer);

        return response()->json(['status' => $status]);
    }

    public function reverbWebhook(Request $request): \Illuminate\Http\JsonResponse
    {
        $this->presenceService->handleReverbWebhook($request->json()->all());

        return response()->json(['status' => 'ok']);
    }
}
