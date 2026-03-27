<?php
// /routes/api.php

use App\Http\Controllers\Admin\GameController;
use App\Http\Controllers\Admin\RoomController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Lobby\LiveGameController;
use App\Http\Controllers\Lobby\LiveRoomController;
use App\Http\Controllers\Lobby\PresenceController;
use Illuminate\Support\Facades\Route;


/*
|--------------------------------------------------------------------------
| Rutas Públicas (No requieren estar logueado)
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/guest-login', [AuthController::class, 'guestLogin']);

    // Ver el listado de salas debe ser público
    Route::get('/rooms', [RoomController::class, 'index']);
    Route::get('/rooms/{id}', [RoomController::class, 'show']);

    /*
    |--------------------------------------------------------------------------
    | Rutas Protegidas (Requieren token de Sanctum)
    |--------------------------------------------------------------------------
    */
    Route::middleware('auth:sanctum')->group(function () {

        // ==========================================================
        // RUTAS DE JUEGO Y SALAS (Solo usuarios autenticados)
        // ==========================================================
        Route::post('/rooms/{id}/join', [LiveRoomController::class, 'join']);
        Route::post('/rooms/{id}/leave', [LiveRoomController::class, 'leave']);
        Route::post('/rooms/{id}/kick', [LiveRoomController::class, 'kick']);

        Route::post('/rooms/{id}/start', [LiveGameController::class, 'start']);
        Route::post('/rooms/{id}/sync', [LiveGameController::class, 'sync']);
        Route::post('/rooms/{id}/action', [LiveGameController::class, 'action']);
        Route::post('/rooms/{id}/end-turn', [LiveGameController::class, 'endTurn']);
        Route::post('/rooms/{id}/react', [LiveGameController::class, 'react']);
        Route::post('/rooms/{id}/react-discard', [LiveGameController::class, 'reactDiscard']);

        Route::post('/rooms/{id}/mark-offline', [PresenceController::class, 'markOffline']);
        Route::post('/rooms/{id}/report-disconnect', [PresenceController::class, 'reportDisconnect']);
        Route::post('/rooms/{id}/report-lobby-disconnect', [PresenceController::class, 'reportLobbyDisconnect']);

        Route::post('/rooms/{id}/luck-challenge', [LiveGameController::class, 'resolveLuckChallenge']);
        Route::post('/rooms/{id}/react-multi', [LiveGameController::class, 'reactMulti']);
        Route::post('/rooms/{id}/discard', [LiveGameController::class, 'discard']);
        Route::post('/rooms/{room}/discard-perks', [LiveGameController::class, 'discardPerks']);

        Route::post('/rooms', [RoomController::class, 'store']);

        // ==========================================================
        // RUTAS DE USUARIO Y PERFIL
        // ==========================================================
        Route::get('/me', [AuthController::class, 'me']);
        Route::get('/me/games', [GameController::class, 'myGames']);

        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/logout-all', [AuthController::class, 'logoutAll']);

        Route::get('/users', [UserController::class, 'index']);
        Route::get('/users/{user}', [UserController::class, 'show']);
        Route::put('/users/{user}', [UserController::class, 'update']);

        Route::get('/games', [GameController::class, 'index']);
        Route::get('/games/{game}', [GameController::class, 'show']);

        // ==========================================================
        // RUTAS SENSIBLES (Solo para Administradores)
        // ==========================================================
        Route::middleware(\App\Http\Middleware\IsAdmin::class)->group(function () {
            Route::post('/users', [UserController::class, 'store']);
            Route::delete('/users/{user}', [UserController::class, 'destroy']);
            Route::post('/games', [GameController::class, 'store']);
        });
    });
});
