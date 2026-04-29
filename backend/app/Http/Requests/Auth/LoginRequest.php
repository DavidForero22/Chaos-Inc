<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'login' => 'required|string',
            'password' => 'required|string|min:8|max:128',
            'remember' => 'nullable|boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'login.required' => 'El usuario o correo electrónico es obligatorio.',
            'login.string' => 'El usuario o correo electrónico no tiene un formato válido.',

            'password.required' => 'La contraseña es obligatoria.',
            'password.string' => 'La contraseña no tiene un formato válido.',
            'password.min' => 'La contraseña debe tener al menos 8 caracteres.',
            'password.max' => 'La contraseña no puede superar 128 caracteres.',
        ];
    }
}
