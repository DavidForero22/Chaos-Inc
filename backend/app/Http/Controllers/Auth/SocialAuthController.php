<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\Auth\SocialAuthService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;
use App\Models\User;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;

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
            Log::error("SocialAuthController.php::callback() - Error al conectar con el proveedor (Socialite).", [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            return redirect("{$frontendUrl}/social-error?error=oauth_failed");
        }

        $currentUser = Auth::guard('web')->user();

        try {
            $user = $socialAuthService->findOrCreateUser($socialUser, $provider, $currentUser);
        } catch (\Exception $e) {
            Log::error("SocialAuthController.php::callback() - Error al asociar el proveedor al usuario.", [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);

            // Por defecto
            $errorCode = 'oauth_failed';
            $message = $e->getMessage();

            // Capturar si el servicio lanzó la excepción manual de "Ya vinculado a otro"
            if ($message === 'VND_ALREADY_LINKED_TO_OTHER') {
                $errorCode = 'provider_taken';
            }
            // Capturar si la base de datos lanzó una violación de restricción única (Error 1062 de MySQL)
            elseif ($e instanceof \Illuminate\Database\QueryException) {
                $errorInfo = $e->errorInfo;
                $mysqlError = $errorInfo[1] ?? 0;

                if ($mysqlError == 1062) {
                    if (str_contains($message, 'users_email_unique')) {
                        // El email ya le pertenece a otra cuenta independiente
                        $errorCode = 'email_taken';
                    } elseif (
                        str_contains($message, 'social_accounts_user_id_provider_name_unique') ||
                        str_contains($message, 'social_accounts_provider_name_provider_id_unique')
                    ) {
                        // La cuenta de Google/Discord ya está amarrada a otro usuario
                        $errorCode = 'provider_taken';
                    }
                }
            }

            return redirect("{$frontendUrl}/social-error?error={$errorCode}");
        }

        Auth::guard('web')->login($user, remember: true);
        request()->session()->regenerate();

        // Recuperar la URL de retorno, si no hay, ir a la raíz
        $returnTo = request()->session()->pull('oauth_return_to', '/');

        // Redirigir al frontend con éxito
        return redirect("{$frontendUrl}{$returnTo}?login=success");
    }

    /**
     * Desvincula una cuenta social de un usuario.
     */
    public function unlinkSocialAccount(Request $request, User $user, string $provider, SocialAuthService $socialAuthService): JsonResponse
    {
        // Solo el propio usuario (o un admin) puede desvincular sus cuentas
        Gate::authorize('update', $user);

        // Validar la contraseña si viene en la request
        $request->validate([
            'password' => 'sometimes|required|string|min:8'
        ]);

        try {
            $socialAuthService->unlinkSocialAccount($user, $provider, $request->input('password'));
        } catch (\Exception $e) {
            if ($e->getMessage() === "PASSWORD_REQUIRED") {
                return response()->json([
                    'error_code' => 'PASSWORD_REQUIRED',
                    'message' => 'Para desvincular tu último método de acceso, primero debes establecer una contraseña.'
                ], 428); // 428 Precondition Required
            }

            return response()->json(['message' => 'Error al desvincular la cuenta.'], 500);
        }

        // Recargamos relaciones para el Resource
        $user->load('socialAccounts');

        return response()->json([
            'message' => 'Cuenta desvinculada correctamente.',
            'user' => new UserResource($user)
        ], 200);
    }
}
