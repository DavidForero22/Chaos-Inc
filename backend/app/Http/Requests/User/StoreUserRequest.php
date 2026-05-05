<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'username' => 'required|string|max:255|unique:users,username',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => 'required|string|min:8', // Puedes añadir '|confirmed' si usas 2 campos de contraseña
            'role' => 'sometimes|in:admin,user',
        ];
    }

    public function messages(): array
    {
        return [
            'username.required' => 'Se requiere un nombre de usuario.',
            'username.unique' => 'Este nombre de usuario ya está en uso. Por favor, elige otro.',
            'email.required' => 'Se requiere una dirección de correo electrónico.',
            'email.email' => 'Por favor, proporciona una dirección de correo electrónico válida.',
            'email.unique' => 'Este correo electrónico ya está registrado en nuestro sistema.',
            'password.required' => 'Se requiere una contraseña.',
            'password.min' => 'La contraseña debe tener al menos 8 caracteres.',
            'role.in' => 'El rol seleccionado no es válido.',
        ];
    }
}
