<?php
// app/Http/Requests/User/UpdateUserRequest.php

namespace App\Http\Requests\User;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // La autorización real la haremos en el controlador
    }

    public function rules(): array
    {
        $userId = $this->route('user');
        $targetUser = User::findOrFail($userId);
        $authUser = $this->user();

        $isAdmin = $authUser && $authUser->role === 'admin';

        // Regla base: El nombre de usuario siempre se puede intentar actualizar
        $rules = [
            'username' => 'nullable|string|max:255|unique:users,username,' . $userId,
        ];

        // Si es administrador, puede editar todo
        if ($isAdmin) {
            $rules['email']    = 'nullable|string|email|max:255|unique:users,email,' . $userId;
            $rules['password'] = 'nullable|string|min:8';
            $rules['role']     = 'nullable|in:admin,user';
        } else {
            // Si NO es admin, verificar si NO es usuario de OAuth para dejarle editar el correo
            if (!$targetUser->isOAuthUser()) {
                $rules['email'] = 'nullable|string|email|max:255|unique:users,email,' . $userId;
            }
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'username.unique' => 'Este nombre de usuario ya está en uso por otro jugador.',
            'email.email'     => 'Por favor, proporciona una dirección de correo electrónico válida.',
            'email.unique'    => 'Este correo electrónico ya está vinculado a otra cuenta.',
            'password.min'    => 'La contraseña debe tener al menos 8 caracteres.',
            'role.in'         => 'El rol seleccionado no es válido.',
        ];
    }
}
