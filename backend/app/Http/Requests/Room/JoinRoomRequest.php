<?php

namespace App\Http\Requests\Room;

use Illuminate\Foundation\Http\FormRequest;

class JoinRoomRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'password' => 'sometimes|string|nullable|min:8|max:128',
        ];
    }

    public function messages(): array
    {
        return [
            'password.string' => 'La contraseña no tiene un formato válido.',
            'password.min' => 'La contraseña debe tener al menos 8 caracteres.',
            'password.max' => 'La contraseña no puede superar 128 caracteres.',
        ];
    }
}
