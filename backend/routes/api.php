<?php
// /routes/api.php

use App\Http\Controllers\Admin\AnalyticsController;
use App\Http\Controllers\Admin\GameController;
use App\Http\Controllers\Admin\RoomController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\FriendshipController;
use App\Http\Controllers\Auth\SocialAuthController;
use App\Http\Controllers\Lobby\DebugController;
use App\Http\Controllers\Lobby\LiveGameController;
use App\Http\Controllers\Lobby\LiveRoomController;
use App\Http\Middleware\IsDebugRoom;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Ruta de check
|--------------------------------------------------------------------------
*/

Route::get('/health', function () {
    return response()->json(['status' => 'healthy', 'message' => 'Chaos Inc. API is running'], 200);
});

/*
|--------------------------------------------------------------------------
| Rutas Públicas (No requieren estar logueado)
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {

    Broadcast::routes(['middleware' => ['auth:sanctum']]);

    // Rutas de autenticacion
    Route::middleware(['throttle:auth'])->group(function () {
        Route::post('/register', [AuthController::class, 'register']);
        Route::post('/login', [AuthController::class, 'login']);
        Route::post('/guest-login', [AuthController::class, 'guestLogin']);
    });

    // Rutas publicas 
    Route::middleware(['throttle:api'])->group(function () {
        Route::get('/rooms', [RoomController::class, 'index']);
        Route::get('/rooms/{id}', [RoomController::class, 'show']);
        Route::get('/cards', [GameController::class, 'getCards']);
        Route::get('/leaderboard', [UserController::class, 'leaderboard']);
    });

    /*
    |--------------------------------------------------------------------------
    | Rutas Protegidas (Requieren token de Sanctum)
    |--------------------------------------------------------------------------
    */
    Route::middleware(['auth:sanctum'])->group(function () {

        // ==========================================================
        // ESCUDO JUEGO: Rutas de juego y salas
        // ==========================================================
        Route::middleware(['throttle:game-actions'])->group(function () {
            Route::post('/rooms/{id}/join', [LiveRoomController::class, 'join']);
            Route::post('/rooms/{id}/leave', [LiveRoomController::class, 'leave']);
            Route::post('/rooms/{id}/kick', [LiveRoomController::class, 'kick']);
            Route::post('/rooms', [RoomController::class, 'store']);
            Route::put('/rooms/{id}', [RoomController::class, 'update']);

            Route::post('/rooms/{id}/start', [LiveGameController::class, 'start']);
            Route::post('/rooms/{id}/sync', [LiveGameController::class, 'sync']);
            Route::post('/rooms/{id}/action', [LiveGameController::class, 'action']);
            Route::post('/rooms/{id}/end-turn', [LiveGameController::class, 'endTurn']);

            Route::post('/rooms/{id}/react', [LiveGameController::class, 'react']);
            Route::post('/rooms/{id}/react-discard', [LiveGameController::class, 'reactDiscard']);
            Route::post('/rooms/{id}/discard', [LiveGameController::class, 'discard']);

            Route::post('/rooms/{id}/report-disconnect', [LiveRoomController::class, 'reportDisconnect']);

            Route::post('/rooms/{id}/luck-challenge', [LiveGameController::class, 'resolveLuckChallenge']);
            Route::post('/rooms/{id}/react-multi', [LiveGameController::class, 'reactMulti']);
            Route::post('/rooms/{room}/discard-perks', [LiveGameController::class, 'discardPerks']);

            Route::post('/rooms/{id}/debug', [DebugController::class, 'handle'])
                ->middleware([IsDebugRoom::class,]);

            Route::get('/gallery', [\App\Http\Controllers\GalleryController::class, 'index']);
        });

        // ==========================================================
        // ESCUDO API (Privado): Rutas de perfil y admin
        // ==========================================================
        Route::middleware(['throttle:api'])->group(function () {
            Route::get('/me', [AuthController::class, 'me']);
            Route::get('/me/games', [GameController::class, 'myGames']);

            Route::post('/logout', [AuthController::class, 'logout']);
            Route::post('/logout-all', [AuthController::class, 'logoutAll']);

            Route::get('/users', [UserController::class, 'index']);
            Route::get('/users/{user}', [UserController::class, 'show']);
            Route::put('/users/{user}', [UserController::class, 'update']);
            Route::post('/users/{user}/avatar', [UserController::class, 'updateAvatar']);
            Route::get('/users/{user}/games', [GameController::class, 'userGames']);
            Route::delete('/users/{user}/social/{provider}', [SocialAuthController::class, 'unlinkSocialAccount']);
            Route::delete('/users/{user}', [UserController::class, 'destroy']);

            // Solicitudes de amistad
            Route::prefix('friends')->group(function () {
                Route::get('/',        [FriendshipController::class, 'index']);
                Route::get('/pending', [FriendshipController::class, 'pendingReceived']);
                Route::get('/sent',    [FriendshipController::class, 'pendingSent']);

                Route::post('/{user}/request', [FriendshipController::class, 'sendRequest']);
                Route::post('/{user}/accept',  [FriendshipController::class, 'accept']);
                Route::post('/{user}/reject',  [FriendshipController::class, 'reject']);

                Route::delete('/{user}', [FriendshipController::class, 'remove']);
            });


            Route::get('/games', [GameController::class, 'index']);
            Route::get('/games/{game}', [GameController::class, 'show']);

            // Rutas de Administrador
            Route::middleware(\App\Http\Middleware\IsAdmin::class)->group(function () {
                Route::get('/analytics', [AnalyticsController::class, 'dashboard']);
                Route::post('/users', [UserController::class, 'store']);
                Route::post('/games', [GameController::class, 'store']);
                Route::post('/users/{user}/temp-password', [UserController::class, 'generateTempPassword']);
                Route::delete('/rooms/{id}', [RoomController::class, 'destroy']);
            });
        });
    });
});
