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
                default    => ['error' => 'No se puede enviar la solicitud.',   'status' => 409],
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

        $friendship->delete();

        return ['data' => null, 'status' => 200];
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

    /**
     * Cancelar una solicitud de amistad que el usuario autenticado ha enviado y sigue pendiente.
     */
    public function cancelRequest(User $auth, User $target): array
    {
        // El usuario no puede cancelar una solicitud hacia sí mismo
        if ($auth->id === $target->id) {
            return ['error' => 'No puedes cancelar una solicitud a ti mismo.', 'status' => 422];
        }

        // Buscar la solicitud donde el autenticado es el remitente y está pendiente
        $friendship = Friendship::where('sender_id', $auth->id)
            ->where('receiver_id', $target->id)
            ->where('status', 'pending')
            ->first();

        if (!$friendship) {
            return ['error' => 'No se encontró ninguna solicitud pendiente enviada a este usuario.', 'status' => 404];
        }

        $friendship->delete();

        return ['data' => null, 'status' => 200];
    }
}
