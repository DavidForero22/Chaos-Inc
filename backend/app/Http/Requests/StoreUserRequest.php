<?php

namespace App\Http\Requests;

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
            'username.required' => 'A username is required.',
            'username.unique' => 'This username is already taken. Please choose another one.',
            'email.required' => 'An email address is required.',
            'email.email' => 'Please provide a valid email address.',
            'email.unique' => 'This email is already registered in our system.',
            'password.required' => 'A password is required.',
            'password.min' => 'The password must be at least 8 characters long.',
            'role.in' => 'The selected role is invalid.',
        ];
    }
}
