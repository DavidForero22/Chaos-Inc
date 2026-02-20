<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // Obtenemos el ID del usuario que estamos editando desde la URL
        $userId = $this->route('user');

        return [
            'username' => 'sometimes|string|max:255|unique:users,username,' . $userId,
            'email' => 'sometimes|string|email|max:255|unique:users,email,' . $userId,
            'password' => 'sometimes|string|min:8',
            'role' => 'sometimes|in:admin,user',
        ];
    }

    public function messages(): array
    {
        return [
            'username.unique' => 'This username is already taken by another player.',
            'email.email' => 'Please provide a valid email address.',
            'email.unique' => 'This email is already linked to another account.',
            'password.min' => 'The password must be at least 8 characters long.',
            'role.in' => 'The selected role is invalid.',
        ];
    }
}
