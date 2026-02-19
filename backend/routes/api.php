<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\GameController;

/*
|--------------------------------------------------------------------------
| Rutas Públicas (No requieren estar logueado)
|--------------------------------------------------------------------------
*/

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

/*
|--------------------------------------------------------------------------
| Rutas Protegidas (Requieren token de Sanctum)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    // Sesión de Usuario
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', function (Request $request) {
        // Devuelve los datos del usuario logueado actualmente
        return $request->user();
    });

    // CRUD de Usuarios
    // (Crea automáticamente: GET /users, POST /users, GET /users/{id}, PUT /users/{id}, DELETE /users/{id})
    Route::apiResource('users', UserController::class);

    // CRUD de Partidas (Games)
    Route::apiResource('games', GameController::class);
});
