<?php
// routes/channels.php

use Illuminate\Support\Facades\Broadcast;

Broadcast::routes(['middleware' => ['auth:sanctum']]);

// Canal de usuario por defecto de Laravel
Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Canal privado por jugador — usado para eventos que solo debe recibir ese jugador concreto (ej: ActingBossAssigned).
Broadcast::channel('player.{playerName}', function ($user, string $playerName) {
    return $user->username === $playerName;
});
