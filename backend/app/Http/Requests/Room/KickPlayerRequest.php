<?php

namespace App\Http\Requests\Room;

use Illuminate\Foundation\Http\FormRequest;

class KickPlayerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'player_to_kick' => 'required|string|min:3|max:30',
        ];
    }

    public function messages(): array
    {
        return [
            'player_to_kick.required' => 'El nombre del jugador a expulsar es obligatorio.',
            'player_to_kick.string' => 'El nombre del jugador a expulsar no tiene un formato válido.',
            'player_to_kick.min' => 'El nombre del jugador a expulsar debe tener al menos 3 caracteres.',
            'player_to_kick.max' => 'El nombre del jugador a expulsar no puede superar 30 caracteres.',
        ];
    }
}
