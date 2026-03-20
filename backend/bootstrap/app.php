<?php

use App\Exceptions\GameException;
use App\Exceptions\RoomException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        channels: __DIR__ . '/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            \Illuminate\Http\Middleware\HandleCors::class,
        ]);
        $middleware->api(append: [
            \Illuminate\Http\Middleware\HandleCors::class,
        ]);
        $middleware->validateCsrfTokens(except: [
            'broadcasting/auth',
            'api/v1/webhooks/reverb',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {

        $exceptions->render(function (RoomException $e, Request $request) {
            return response()->json([
                'error' => $e->getMessage(),
                'type' => $e->getErrorType()
            ], $e->getCode());
        });

        $exceptions->render(function (GameException $e, Request $request) {
            return response()->json([
                'error' => $e->getMessage(),
                'type' => $e->getErrorType()
            ], $e->getCode());
        });
    })->create();
