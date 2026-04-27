<?php
// app/Providers/AppServiceProvider.php

namespace App\Providers;

use Illuminate\Http\Request;
use Illuminate\Support\ServiceProvider;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Request::macro('shouldLog', function () {
            return !str_contains($this->path(), 'api/v1/rooms')
                || $this->isMethod('POST');
        });

        // Límite general para la API (Navegación normal)
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(120)->by($request->user()?->id ?: $request->ip());
        });

        // Límite estricto para Autenticación (Previene fuerza bruta y bots)
        RateLimiter::for('auth', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });

        // Límite generoso para el juego (Evita spam masivo, pero permite jugar fluido)
        RateLimiter::for('game-actions', function (Request $request) {
            // Usar el token de la partida para identificar al jugador, o la IP como respaldo
            return Limit::perMinute(300)->by($request->header('X-Game-Token') ?: $request->ip());
        });
    }
}
