<?php
// routes/channels.php

use Illuminate\Support\Facades\Broadcast;

Broadcast::routes(['middleware' => ['api', 'auth:sanctum']]);

// Canal de usuario por defecto de Laravel
Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('room.{roomId}', function ($user, $roomId) {
    return [
        'id' => $user->id,
        'username' => $user->username,
    ];
});

Broadcast::channel('users.{id}', function ($user, $id) {
    // Solo puedes suscribirte a tu propio canal
    return (int) $user->id === (int) $id;
});
