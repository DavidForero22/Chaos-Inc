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
            'player_to_kick_id' => 'required|integer|exists:users,id',
        ];
    }

    public function messages(): array
    {
        return [
            'player_to_kick_id.required' => 'El id del jugador a expulsar es obligatorio.',
            'player_to_kick_id.integer' => 'El id del jugador a expulsar no tiene un formato válido.',
        ];
    }
}
