<?php

use App\Exceptions\GameException;
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
        //
    })
    ->withExceptions(function (Exceptions $exceptions) {

        // --- Capturar GameException globalmente ---
        $exceptions->render(function (GameException $e, Request $request) {
            return response()->json([
                'error' => $e->getMessage(),
                'type'  => $e->getErrorType()
            ], $e->getCode());
        });
    })->create();
