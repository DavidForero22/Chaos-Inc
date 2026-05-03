<?php

use App\Http\Controllers\SocialAuthController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// --- OAuth Social Login ---
// Estas rutas viven en web.php porque Socialite usa sesión para el "state" anti-CSRF
Route::prefix('auth')->group(function () {
    Route::get('/{provider}/redirect', [SocialAuthController::class, 'redirect'])
        ->name('social.redirect');

    Route::get('/{provider}/callback', [SocialAuthController::class, 'callback'])
        ->name('social.callback');
});
