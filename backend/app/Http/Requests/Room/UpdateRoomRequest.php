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
            // nullable permite que venga vacío. Si viene, exige min 8 chars.
            'password'     => 'nullable|string|min:8|max:128',
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
}
