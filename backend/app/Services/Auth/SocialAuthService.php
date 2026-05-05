<?php

namespace App\Services\Auth;

use App\Models\User;
use Laravel\Socialite\Contracts\User as SocialUser;

class SocialAuthService
{
    /**
     * Encuentra un usuario existente o crea uno nuevo a partir de los datos OAuth.
     *
     * Prioridad de búsqueda:
     *   1. Por provider + provider_id  → usuario ya registrado con OAuth
     *   2. Por email                   → usuario con cuenta normal que usa el mismo email
     *   3. Crear nuevo usuario
     */
    public function findOrCreateUser(SocialUser $socialUser, string $provider): User
    {
        // 1. Buscar por provider_id (login recurrente con OAuth)
        $user = User::where('provider', $provider)
            ->where('provider_id', $socialUser->getId())
            ->first();

        if ($user) {
            // Guardar en provider_avatar respetando el avatar manual
            $user->update(['provider_avatar' => $socialUser->getAvatar()]);
            return $user;
        }

        // 2. Buscar por email (vincular cuenta existente al proveedor)
        if ($socialUser->getEmail()) {
            $existingUser = User::where('email', $socialUser->getEmail())->first();

            if ($existingUser) {
                $existingUser->update([
                    'provider'        => $provider,
                    'provider_id'     => $socialUser->getId(),
                    'provider_avatar' => $socialUser->getAvatar(),
                ]);
                return $existingUser;
            }
        }

        // 3. Crear usuario nuevo
        return $this->createOAuthUser($socialUser, $provider);
    }

    private function createOAuthUser(SocialUser $socialUser, string $provider): User
    {
        $displayName = $socialUser->getName()
            ?? $socialUser->getNickname()
            ?? 'user';

        $username = $this->generateUsername($displayName);

        // Discord no siempre entrega email: generamos uno placeholder único
        $email = $socialUser->getEmail()
            ?? "{$provider}_{$socialUser->getId()}@oauth.noemail";

        return User::create([
            'username'        => $username,
            'email'           => $email,
            'password'        => null,
            'role'            => 'user',
            'is_guest'        => false,
            'provider'        => $provider,
            'provider_id'     => $socialUser->getId(),
            'avatar'          => null,
            'provider_avatar' => $socialUser->getAvatar(),
        ]);
    }

    /**
     * Genera un username único basado en el display name del proveedor.
     * Sanitiza el nombre y añade un sufijo numérico si ya está en uso.
     */
    private function generateUsername(string $displayName): string
    {
        // Espacios → guión bajo, eliminar caracteres no permitidos, recortar a 12 chars
        $base = preg_replace('/[^A-Za-z0-9_]/', '', str_replace(' ', '_', $displayName));
        $base = $base ?: 'user';
        $base = substr($base, 0, 12);

        $username = $base;
        $counter  = 1;

        while (User::where('username', $username)->exists()) {
            $username = $base . '_' . $counter;
            $counter++;
        }

        return $username;
    }
}
