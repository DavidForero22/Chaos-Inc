<?php
// app/Http/Controllers/FriendshipController.php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Resources\FriendRequestResource;
use App\Models\User;
use App\Services\Auth\FriendshipService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FriendshipController extends Controller
{
    public function __construct(private FriendshipService $friendshipService) {}

    /** GET /friends — Amigos confirmados */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user()->load(['friendsOfMine', 'friendOf']);
        $friends = $user->getFriends();

        return response()->json([
            'data' => $friends->map(fn($f) => [
                'id'       => $f->id,
                'username' => $f->username,
                'avatar'   => $f->avatar,
                'totalXp'  => $f->total_xp,
            ])
        ]);
    }

    /** GET /friends/pending — Solicitudes recibidas pendientes */
    public function pendingReceived(Request $request): JsonResponse
    {
        $requests = $request->user()
            ->receivedFriendRequests()
            ->where('status', 'pending')
            ->with('sender')
            ->get();

        return response()->json([
            'data' => FriendRequestResource::collection($requests)
        ]);
    }

    /** GET /friends/sent — Solicitudes enviadas pendientes */
    public function pendingSent(Request $request): JsonResponse
    {
        $requests = $request->user()
            ->sentFriendRequests()
            ->where('status', 'pending')
            ->with('receiver')
            ->get();

        return response()->json([
            'data' => FriendRequestResource::collection($requests)
        ]);
    }

    /** POST /friends/{user}/request — Enviar solicitud */
    public function sendRequest(Request $request, User $user): JsonResponse
    {
        $result = $this->friendshipService->sendRequest($request->user(), $user);

        return isset($result['error'])
            ? response()->json(['message' => $result['error']], $result['status'])
            : response()->json(['data' => $result['data']], $result['status']);
    }

    /** POST /friends/{user}/accept — Aceptar solicitud */
    public function accept(Request $request, User $user): JsonResponse
    {
        $result = $this->friendshipService->acceptRequest($request->user(), $user);

        return isset($result['error'])
            ? response()->json(['message' => $result['error']], $result['status'])
            : response()->json(['data' => $result['data']]);
    }

    /** POST /friends/{user}/reject — Rechazar solicitud */
    public function reject(Request $request, User $user): JsonResponse
    {
        $result = $this->friendshipService->rejectRequest($request->user(), $user);

        return isset($result['error'])
            ? response()->json(['message' => $result['error']], $result['status'])
            : response()->json(['data' => $result['data']]);
    }

    /** DELETE /friends/{user} — Eliminar amigo o cancelar solicitud */
    public function remove(Request $request, User $user): JsonResponse
    {
        $result = $this->friendshipService->removeFriend($request->user(), $user);

        return isset($result['error'])
            ? response()->json(['message' => $result['error']], $result['status'])
            : response()->json(['message' => 'Relación eliminada correctamente.']);
    }
}
