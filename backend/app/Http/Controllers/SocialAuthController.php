<?php

namespace App\Http\Controllers;

use App\Services\Auth\SocialAuthService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;

class SocialAuthController extends Controller
{
    // Proveedores permitidos. Añade aquí si en el futuro incorporas más.
    private const ALLOWED_PROVIDERS = ['google', 'discord'];

    /**
     * Redirige al usuario a la página de autenticación del proveedor.
     */
    public function redirect(string $provider): RedirectResponse
    {
        abort_unless(in_array($provider, self::ALLOWED_PROVIDERS), 404);

        /** @var \Laravel\Socialite\Two\AbstractProvider $driver */
        $driver = Socialite::driver($provider);

        // Discord requiere los scopes explícitamente para obtener email
        if ($provider === 'discord') {
            $driver->scopes(['identify', 'email']);
        }

        return $driver->redirect();
    }

    /**
     * Maneja el callback de vuelta desde el proveedor OAuth.
     */
    public function callback(string $provider, SocialAuthService $socialAuthService): RedirectResponse
    {
        abort_unless(in_array($provider, self::ALLOWED_PROVIDERS), 404);

        $frontendUrl = config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173'));

        try {
            $socialUser = Socialite::driver($provider)->user();
        } catch (\Exception $e) {
            // El usuario canceló o hubo un error en el proveedor
            return redirect("{$frontendUrl}/login?error=oauth_cancelled");
        }

        try {
            $user = $socialAuthService->findOrCreateUser($socialUser, $provider);
        } catch (\Exception $e) {
            return redirect("{$frontendUrl}/login?error=oauth_failed");
        }

        Auth::guard('web')->login($user, remember: true);
        request()->session()->regenerate();

        // Redirigir al frontend. El frontend leerá /api/v1/me para obtener el usuario.
        return redirect("{$frontendUrl}/");
    }
}
