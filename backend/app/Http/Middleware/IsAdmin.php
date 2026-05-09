<?php

// app/Http/Middleware/IsAdmin.php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class IsAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        // Comprobar si el usuario está logueado y si su rol es 'admin'
        if ($request->user() && $request->user()->role === 'admin') {
            return $next($request);
        }

        // Si es un 'user' normal, denegar
        return response()->json([
            'message' => 'Acceso denegado.'
        ], 403);
    }
}
