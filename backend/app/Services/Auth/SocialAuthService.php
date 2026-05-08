<?php
// app/Services/Auth/SocialAuthService.php

namespace App\Services\Auth;

use App\Models\User;
use App\Models\SocialAccount;
use Illuminate\Support\Facades\DB;
use Laravel\Socialite\Contracts\User as SocialUser;

class SocialAuthService
{
    public function findOrCreateUser(SocialUser $socialUser, string $provider): User
    {
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

    private function generateUsername(string $displayName): string
    {
        $base = preg_replace('/[^A-Za-z0-9_]/', '', str_replace(' ', '_', $displayName));
        $base = $base ?: 'user';
        $base = substr($base, 0, 12);

        $existingUsernames = User::where('username', 'REGEXP', '^' . preg_quote($base) . '(_[0-9]+)?$')
            ->pluck('username')
            ->toArray();

        if (empty($existingUsernames)) {
            return $base;
        }

        if (!in_array($base, $existingUsernames)) {
            return $base;
        }

        $maxSuffix = 1;
        foreach ($existingUsernames as $username) {
            if (preg_match('/_([0-9]+)$/', $username, $matches)) {
                $maxSuffix = max($maxSuffix, (int)$matches[1]);
            }
        }

        return $base . '_' . ($maxSuffix + 1);
    }
}
