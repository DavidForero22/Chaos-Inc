<?php
// app/Services/Auth/FriendshipService.php

namespace App\Services\Auth;

use App\Models\Friendship;
use App\Models\User;
use Illuminate\Support\Collection;

class FriendshipService
{
    /**
     * Enviar solicitud de amistad.
     */
    public function sendRequest(User $sender, User $receiver): array
    {
        if ($sender->id === $receiver->id) {
            return ['error' => 'No puedes enviarte una solicitud a ti mismo.', 'status' => 422];
        }

        $existing = $sender->friendshipWith($receiver);

        if ($existing) {
            return match ($existing->status) {
                'accepted' => ['error' => 'Ya sois amigos.',               'status' => 409],
                'pending'  => ['error' => 'Ya existe una solicitud pendiente.', 'status' => 409],
                'rejected' => ['error' => 'Esta solicitud fue rechazada.',  'status' => 409],
            };
        }

        $friendship = Friendship::create([
            'sender_id'   => $sender->id,
            'receiver_id' => $receiver->id,
            'status'      => 'pending',
        ]);

        return ['data' => $friendship, 'status' => 201];
    }

    /**
     * Aceptar solicitud de amistad.
     */
    public function acceptRequest(User $receiver, User $sender): array
    {
        $friendship = Friendship::where('sender_id', $sender->id)
            ->where('receiver_id', $receiver->id)
            ->where('status', 'pending')
            ->first();

        if (! $friendship) {
            return ['error' => 'Solicitud no encontrada.', 'status' => 404];
        }

        $friendship->update(['status' => 'accepted']);

        return ['data' => $friendship, 'status' => 200];
    }

    /**
     * Rechazar solicitud de amistad.
     */
    public function rejectRequest(User $receiver, User $sender): array
    {
        $friendship = Friendship::where('sender_id', $sender->id)
            ->where('receiver_id', $receiver->id)
            ->where('status', 'pending')
            ->first();

        if (! $friendship) {
            return ['error' => 'Solicitud no encontrada.', 'status' => 404];
        }

        $friendship->update(['status' => 'rejected']);

        return ['data' => $friendship, 'status' => 200];
    }

    /**
     * Eliminar amistad o cancelar solicitud enviada.
     */
    public function removeFriend(User $auth, User $target): array
    {
        $friendship = $auth->friendshipWith($target);

        if (! $friendship) {
            return ['error' => 'No existe ninguna relación con este usuario.', 'status' => 404];
        }

        // Solo puede eliminar si es participante de la relación
        if ($friendship->sender_id !== $auth->id && $friendship->receiver_id !== $auth->id) {
            return ['error' => 'No autorizado.', 'status' => 403];
        }

        $friendship->delete();

        return ['data' => null, 'status' => 200];
    }

    /**
     * Lista de amigos confirmados.
     */
    public function getFriends(User $user): Collection
    {
        return $user->friends();
    }

    /**
     * Solicitudes recibidas pendientes.
     */
    public function getPendingReceived(User $user): Collection
    {
        return $user->receivedFriendRequests()
            ->where('status', 'pending')
            ->with('sender')
            ->get();
    }

    /**
     * Solicitudes enviadas pendientes.
     */
    public function getPendingSent(User $user): Collection
    {
        return $user->sentFriendRequests()
            ->where('status', 'pending')
            ->with('receiver')
            ->get();
    }
}