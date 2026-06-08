<?php

use App\Exceptions\GameException;
use App\Exceptions\RoomException;
use App\Exceptions\UserException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        channels: __DIR__ . '/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {

        $middleware->statefulApi();

        $middleware->web(append: [
            \Illuminate\Http\Middleware\HandleCors::class,
        ]);
        $middleware->api(append: [
            \Illuminate\Http\Middleware\HandleCors::class,
        ]);
        $middleware->validateCsrfTokens(except: [
            'broadcasting/auth',
            'api/v1/rooms/*/leave', // Cubierto por game_token validado en Redis
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {

        $exceptions->dontReport([
            RoomException::class,
            GameException::class,
            UserException::class
        ]);
    })->create();
