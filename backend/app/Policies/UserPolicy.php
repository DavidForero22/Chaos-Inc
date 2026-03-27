<?php
// app/Policies/UserPolicy.php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\Response;

class UserPolicy
{
    /**
     * Determina si el usuario puede actualizar un perfil.
     */
    public function update(User $currentUser, User $targetUser): Response
    {
        // Si el usuario se edita a si mismo
        if ($currentUser->id === $targetUser->id) {
            return Response::allow();
        }

        // Si el usuario edita a otro, debe ser admin
        if ($currentUser->role === 'admin') {
            return Response::allow();
        }

        // Si el usuario edita otro usuario y no es admin
        return Response::deny("You don't have permission to edit another user's profile.");
    }

    /**
     * Determina si el usuario puede borrar un perfil.
     */
    public function delete(User $currentUser, User $targetUser): Response
    {

        if ($currentUser->role === 'admin' && $currentUser->id == $targetUser->id) {
            return Response::deny("You can't delete yourself.");
        }

        // Solo un admin puede borrar, pero NUNCA a sí mismo
        return Response::allow();
    }
}
