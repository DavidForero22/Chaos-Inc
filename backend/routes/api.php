<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\GameController;
use App\Http\Controllers\LiveGameController;
use App\Http\Controllers\LiveRoomController;
use App\Http\Controllers\RoomController;

/*
|--------------------------------------------------------------------------
| Rutas Públicas (No requieren estar logueado)
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/guest-login', [AuthController::class, 'guestLogin']);

    Route::get('/rooms', [RoomController::class, 'index']);
    Route::get('/rooms/{id}', [RoomController::class, 'show']);

    Route::post('/rooms/{id}/join', [LiveRoomController::class, 'join']);
    Route::post('/rooms/{id}/leave', [LiveRoomController::class, 'leave']);
    Route::post('/rooms/{id}/kick', [LiveRoomController::class, 'kick']);

    Route::post('/rooms/{id}/start', [LiveGameController::class, 'start']);
    Route::post('/rooms/{id}/sync', [LiveGameController::class, 'sync']);
    Route::post('/rooms/{id}/action', [LiveGameController::class, 'action']);
    Route::post('/rooms/{id}/end-turn', [LiveGameController::class, 'endTurn']);
    Route::post('/rooms/{id}/react', [LiveGameController::class, 'react']);


    /*
|--------------------------------------------------------------------------
| Rutas Protegidas (Requieren token de Sanctum)
|--------------------------------------------------------------------------
*/
    Route::middleware('auth:sanctum')->group(function () {

        // RUTAS PARA TODOS LOS LOGUEADOS (Admins y Users)
        Route::get('/me', function (Request $request) {
            return $request->user();
        });
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/logout-all', [AuthController::class, 'logoutAll']);

        Route::get('/users', [UserController::class, 'index']);
        Route::get('/users/{user}', [UserController::class, 'show']);
        Route::put('/users/{user}', [UserController::class, 'update']);

        Route::get('/games', [GameController::class, 'index']);
        Route::get('/games/{game}', [GameController::class, 'show']);

        Route::post('/rooms', [RoomController::class, 'store']);

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
