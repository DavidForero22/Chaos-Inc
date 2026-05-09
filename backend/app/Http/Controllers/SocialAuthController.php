<?php

namespace App\Http\Controllers;

use App\Services\Auth\SocialAuthService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;

class SocialAuthController extends Controller
{
    // Proveedores permitidos. Añade aquí si en el futuro incorporas más.
    private const ALLOWED_PROVIDERS = ['google', 'discord'];

    /**
     * Redirige al usuario a la página de autenticación del proveedor.
     */
    public function redirect(string $provider, Request $request): RedirectResponse
    {
        abort_unless(in_array($provider, self::ALLOWED_PROVIDERS), 404);

        // Guardar la URL de retorno en la sesión si existe
        if ($request->has('return_to')) {
            $request->session()->put('oauth_return_to', $request->input('return_to'));
        }

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
            return redirect("{$frontendUrl}/social-error?error=oauth_failed");
        }

        try {
            $user = $socialAuthService->findOrCreateUser($socialUser, $provider);
        } catch (\Exception $e) {
            return redirect("{$frontendUrl}/social-error?error=oauth_failed");
        }

        Auth::guard('web')->login($user, remember: true);
        request()->session()->regenerate();

        // Recuperar la URL de retorno, si no hay, ir a la raíz
        $returnTo = request()->session()->pull('oauth_return_to', '/');

        // Redirigir al frontend a la sala correspondiente (o al menú)
        return redirect("{$frontendUrl}{$returnTo}?login=success");
    }
}
