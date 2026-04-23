<?php
// backend\app\Http\Requests\Auth\RegisterUserRequest.php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class RegisterUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'username' => 'required|string|min:3|max:30|unique:users,username',
            'email' => 'required|string|email|min:5|max:255|unique:users,email',
            'password' => 'required|string|min:8|max:128|confirmed',
        ];
    }

    public function messages(): array
    {
        return [
            'username.required' => 'El nombre de usuario es obligatorio.',
            'username.string' => 'El nombre de usuario no tiene un formato válido.',
            'username.min' => 'El nombre de usuario debe tener al menos 3 caracteres.',
            'username.max' => 'El nombre de usuario no puede superar 30 caracteres.',
            'username.unique' => 'El nombre de usuario ya está en uso.',

            'email.required' => 'El correo electrónico es obligatorio.',
            'email.string' => 'El correo electrónico no tiene un formato válido.',
            'email.email' => 'El correo electrónico no tiene un formato válido.',
            'email.min' => 'El correo electrónico debe tener al menos 5 caracteres.',
            'email.max' => 'El correo electrónico no puede superar 255 caracteres.',
            'email.unique' => 'El correo electrónico ya está en uso.',

            'password.required' => 'La contraseña es obligatoria.',
            'password.string' => 'La contraseña no tiene un formato válido.',
            'password.min' => 'La contraseña debe tener al menos 8 caracteres.',
            'password.max' => 'El correo electrónico no puede superar 128 caracteres.',
            'password.confirmed' => 'Las contraseñas no coinciden.',
        ];
    }
}
