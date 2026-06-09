<?php
// app/Services/Auth/SocialAuthService.php

namespace App\Services\Auth;

use App\Models\User;
use App\Models\SocialAccount;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Laravel\Socialite\Contracts\User as SocialUser;

class SocialAuthService
{
    public function findOrCreateUser(SocialUser $socialUser, string $provider, ?User $currentUser = null): User
    {
        // CASO A: EL USUARIO YA ESTÁ LOGUEADO
        if ($currentUser) {
            // Verificar si esta cuenta social ya está vinculada a otro usuario distinto
            $socialAccount = SocialAccount::where('provider_name', $provider)
                ->where('provider_id', $socialUser->getId())
                ->first();

            if ($socialAccount && $socialAccount->user_id !== $currentUser->id) {
                // Evita que vinculen una cuenta de Google que ya le pertenece a otra persona
                throw new \Exception("VND_ALREADY_LINKED_TO_OTHER");
            }

            if (!$socialAccount) {
                // Vincular la cuenta de Google/Discord al usuario admin actual
                $this->linkSocialAccount($currentUser, $socialUser, $provider);
            }

            // Actualizar avatar si el admin no tiene uno principal
            if (is_null($currentUser->avatar) && $socialUser->getAvatar()) {
                $currentUser->update(['avatar' => $socialUser->getAvatar()]);
            }

            return $currentUser;
        }

        // CASO B: EL USUARIO NO ESTÁ LOGUEADO
        // Buscar si esta cuenta social específica ya está registrada
        $socialAccount = SocialAccount::where('provider_name', $provider)
            ->where('provider_id', $socialUser->getId())
            ->first();

        if ($socialAccount) {
            // Actualizar avatar de la red social por si lo cambiaron en Google/Discord
            $socialAccount->update(['provider_avatar' => $socialUser->getAvatar()]);

            $user = $socialAccount->user;

            // Si el usuario no tiene foto principal, poner la foto de este proveedor
            if (is_null($user->avatar) && $socialUser->getAvatar()) {
                $user->update(['avatar' => $socialUser->getAvatar()]);
            }

            return $user;
        }

        // Si no existe la cuenta social, buscar si el usuario ya existe por email
        $email = $socialUser->getEmail();
        if ($email) {
            $existingUser = User::where('email', $email)->first();

            if ($existingUser) {
                // El email existe. Vincular esta nueva red social a su cuenta
                $this->linkSocialAccount($existingUser, $socialUser, $provider);

                // Si no tenía foto, poner esta
                if (is_null($existingUser->avatar) && $socialUser->getAvatar()) {
                    $existingUser->update(['avatar' => $socialUser->getAvatar()]);
                }

                return $existingUser;
            }
        }

        // Ni cuenta social ni email existen. Crear un usuario nuevo.
        return $this->createOAuthUser($socialUser, $provider);
    }

    private function createOAuthUser(SocialUser $socialUser, string $provider): User
    {
        // Usar una transacción para que, si falla la creación de la cuenta social, 
        // no se quede un usuario "huérfano" en la base de datos.
        return DB::transaction(function () use ($socialUser, $provider) {

            $displayName = $socialUser->getName() ?? $socialUser->getNickname() ?? 'user';
            $username = $this->generateUsername($displayName);

            $email = $socialUser->getEmail() ?? "{$provider}_{$socialUser->getId()}@oauth.noemail";

            // Creamos la Identidad Central
            $user = User::create([
                'username' => $username,
                'email'    => $email,
                'password' => null,
                'role'     => 'user',
                'is_guest' => false,
                'avatar'   => $socialUser->getAvatar(),
            ]);

            // Vincular su primer método de acceso
            $this->linkSocialAccount($user, $socialUser, $provider);

            return $user;
        });
    }

    private function linkSocialAccount(User $user, SocialUser $socialUser, string $provider): void
    {
        $user->socialAccounts()->create([
            'provider_name'   => $provider,
            'provider_id'     => $socialUser->getId(),
            'provider_avatar' => $socialUser->getAvatar(),
        ]);
    }

    /**
     * Desvincula un proveedor social, requiriendo contraseña si es la última forma de acceso.
     */
    public function unlinkSocialAccount(User $user, string $provider, ?string $password): User
    {
        return DB::transaction(function () use ($user, $provider, $password) {
            $hasPassword = !is_null($user->password);
            $socialAccountsCount = $user->socialAccounts()->count();

            // Si no tiene contraseña y solo le queda esta cuenta social, debe crear una
            if (!$hasPassword && $socialAccountsCount === 1) {
                if (!$password) {
                    throw new \Exception("PASSWORD_REQUIRED");
                }

                $user->update([
                    'password' => Hash::make($password)
                ]);
            }

            // Eliminar la cuenta social específica
            $user->socialAccounts()->where('provider_name', $provider)->delete();

            return $user;
        });
    }

    private function generateUsername(string $displayName): string
    {
        // Limpiar caracteres extraños
        $base = preg_replace('/[^A-Za-z0-9_]/', '', str_replace(' ', '_', $displayName));
        $base = $base ?: 'user';
        $base = substr($base, 0, 12);
        $baseLower = strtolower($base);

        $existingUsernames = User::where('username', 'LIKE', $base . '%')
            ->pluck('username')
            ->filter(function ($username) use ($baseLower) {
                return preg_match('/^' . preg_quote($baseLower, '/') . '(_[0-9]+)?$/i', strtolower($username));
            })
            ->toArray();

        // Si no hay colisiones, el nombre base está libre
        if (empty($existingUsernames)) {
            return $base;
        }

        // Comprobación estricta ignorando mayúsculas/minúsculas
        $lowercaseUsernames = array_map('strtolower', $existingUsernames);
        if (!in_array($baseLower, $lowercaseUsernames)) {
            return $base;
        }

        // Calcular el sufijo más alto
        $maxSuffix = 1;
        foreach ($existingUsernames as $username) {
            if (preg_match('/_([0-9]+)$/', $username, $matches)) {
                $maxSuffix = max($maxSuffix, (int)$matches[1]);
            }
        }

        return $base . '_' . ($maxSuffix + 1);
    }
}
