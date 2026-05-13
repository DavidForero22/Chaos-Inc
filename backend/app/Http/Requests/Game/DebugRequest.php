<?php

namespace App\Http\Requests\Game;

use Illuminate\Foundation\Http\FormRequest;

class DebugRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'player_id'                          => ['required', 'int'],

            // Modificaciones del jugador
            'player_modifications'               => ['sometimes', 'array'],
            'player_modifications.set_stress'    => ['sometimes', 'integer', 'min:0', 'max:4'],
            'player_modifications.add_cards'     => ['sometimes', 'array', 'min:1'],
            'player_modifications.add_cards.*'   => ['integer', 'min:1'],
            'player_modifications.set_is_dead'   => ['sometimes', 'boolean'],

            // Acciones de sala
            'room_actions'                       => ['sometimes', 'array'],
            'room_actions.force_win'             => ['sometimes', 'string', 'in:boss,intern,union,cancelled'],
        ];
    }

    public function messages(): array
    {
        return [
            'player_id.required'                   => 'El campo player_id es requerido.',
            'player_modifications.set_stress.min'  => 'El estrés no puede ser negativo.',
            'player_modifications.set_stress.max'  => 'El estrés máximo no puede ser igual a la vida total del jugador.',
            'room_actions.force_win.in'            => 'force_win debe ser: boss, intern, union o cancelled.',
        ];
    }
}
