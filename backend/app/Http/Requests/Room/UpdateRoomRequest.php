<?php

namespace App\Http\Requests\Room;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Auth\Access\AuthorizationException;

class UpdateRoomRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        if (!$user || $user->is_guest) {
            return false;
        }
        return true;
    }

    protected function failedAuthorization()
    {
        throw new AuthorizationException('No tienes permiso para editar salas.');
    }

    public function rules(): array
    {
        return [
            'name'         => 'required|string|min:3|max:50',
            'max_players'  => 'required|integer|min:3|max:6',
            'is_private'   => 'required|boolean',
            'keep_password' => 'sometimes|boolean',
            // Se excluye si no es privada. Si es privada, es requerida a menos que keep_password sea true.
            'password' => 'exclude_if:keep_password,true|exclude_unless:is_private,true|required|string|min:8|max:128',
            'turn_timeout' => 'required|integer|min:60|max:120',
            'is_debug'     => [
                'sometimes',
                'boolean',
                function ($attribute, $value, $fail) {
                    if ($value && $this->user()?->role !== 'admin') {
                        $fail('Solo los administradores pueden crear salas de prueba.');
                    }
                },
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'El nombre de la sala es obligatorio.',
            'name.string' => 'El nombre de la sala no tiene un formato válido.',
            'name.min' => 'El nombre de la sala debe tener al menos 3 caracteres.',
            'name.max' => 'El nombre de la sala no puede superar 50 caracteres.',

            'max_players.required' => 'El número máximo de jugadores es obligatorio.',
            'max_players.integer' => 'El número máximo de jugadores no tiene un formato válido.',
            'max_players.min' => 'La sala debe permitir al menos 3 jugadores.',
            'max_players.max' => 'La sala no puede permitir más de 6 jugadores.',

            'is_private.required' => 'Debes indicar si la sala es privada o no.',
            'is_private.boolean' => 'El campo de privacidad no tiene un formato válido.',

            'password.required_unless' => 'La contraseña es obligatoria si no mantienes la anterior.',
            'password.min' => 'La contraseña debe tener al menos 8 caracteres.',
            'password.max' => 'La contraseña no puede superar 128 caracteres.',

            'turn_timeout.required' => 'El tiempo por turno es obligatorio.',
            'turn_timeout.integer' => 'El tiempo por turno no tiene un formato válido.',
            'turn_timeout.min' => 'El tiempo por turno debe ser de al menos 60 segundos.',
            'turn_timeout.max' => 'El tiempo por turno no puede superar 120 segundos.',
        ];
    }
}
