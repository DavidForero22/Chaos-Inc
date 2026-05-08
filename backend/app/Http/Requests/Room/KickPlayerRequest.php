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
            'player_to_kick' => 'required|integer',
        ];
    }

    public function messages(): array
    {
        return [
            'player_to_kick.required' => 'El id del jugador a expulsar es obligatorio.',
            'player_to_kick.integer' => 'El id del jugador a expulsar no tiene un formato válido.',
        ];
    }
}
