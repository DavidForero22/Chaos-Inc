<?php
// app/Http/Requests/User/UpdateUserRequest.php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->route('user');

        return [
            'username' => 'sometimes|string|max:255|unique:users,username,' . $userId,
            'email'    => 'sometimes|string|email|max:255|unique:users,email,' . $userId,
            'password' => 'sometimes|string|min:8',
            'role'     => 'sometimes|in:admin,user',
        ];
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
