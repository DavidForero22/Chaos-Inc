<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class IsAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        // Comprobamos si el usuario está logueado y si su rol es 'admin'
        if ($request->user() && $request->user()->role === 'admin') {
            return $next($request); // Adelante, puedes pasar
        }

        // Si es un 'user' normal, le damos un portazo en la cara (Error 403 Forbidden)
        return response()->json([
            'message' => 'Administrator permissions are required.'
        ], 403);
    }
}
