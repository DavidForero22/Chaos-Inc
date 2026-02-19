<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\Response;

class UserPolicy
{
    /**
     * Determina si el usuario puede actualizar un perfil.
     */
    public function update(User $currentUser, User $targetUser): bool
    {
        if ($currentUser->role === 'admin') {
            // Un admin puede editar a cualquiera MENOS a sí mismo
            return $currentUser->id !== $targetUser->id;
        }

        // Un usuario normal SOLO puede editarse a sí mismo
        return $currentUser->id === $targetUser->id;
    }

    /**
     * Determina si el usuario puede borrar un perfil.
     */
    public function delete(User $currentUser, User $targetUser): bool
    {
        // Solo un admin puede borrar, pero NUNCA a sí mismo
        return $currentUser->role === 'admin' && $currentUser->id !== $targetUser->id;
    }
}
