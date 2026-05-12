<?php

namespace App\Http\Requests\Game;

use Illuminate\Foundation\Http\FormRequest;

class DebugRequest extends FormRequest
{
    public function authorize(): bool
    {
        // La autorización la gestiona el middleware IsAdmin
        return true;
    }

    public function rules(): array
    {
        return [
            'player_id'                        => ['required', 'string'],

            // Modificaciones del jugador
            'player_modifications'               => ['sometimes', 'array'],
            'player_modifications.set_stress'    => ['sometimes', 'integer', 'min:0', 'max:4'],
            'player_modifications.add_cards'     => ['sometimes', 'array', 'min:1'],
            'player_modifications.add_cards.*'   => ['integer', 'min:1'],
            'player_modifications.set_role'      => ['sometimes', 'string', 'in:boss,secretary,intern,union'],
            'player_modifications.set_is_dead'   => ['sometimes', 'boolean'],

            // Acciones de sala
            'room_actions'                     => ['sometimes', 'array'],
            'room_actions.force_win'           => ['sometimes', 'string', 'in:boss,intern,union,cancelled'],
            'room_actions.remove_ghosts'       => ['sometimes', 'array', 'min:1'],
            'room_actions.remove_ghosts.*'     => ['string'],

            // Crear jugador fantasma
            'spawn_ghost'                      => ['sometimes', 'array'],
            'spawn_ghost.username'             => ['required_with:spawn_ghost', 'string', 'min:2', 'max:50'],
            'spawn_ghost.role'                 => ['required_with:spawn_ghost', 'string', 'in:boss,secretary,intern,union'],
        ];
    }

    public function messages(): array
    {
        return [
            'player_id.required'                   => 'El campo player_id es requerido.',
            'player_modifications.set_stress.min'  => 'El estrés no puede ser negativo.',
            'player_modifications.set_stress.max'  => 'El estrés maximo no puede ser igual a la vida total del jugador.', 
            'player_modifications.set_role.in'     => 'El rol debe ser: boss, secretary, intern o union.',
            'room_actions.force_win.in'            => 'force_win debe ser: boss, intern, union o cancelled.',
            'spawn_ghost.username.required_with'   => 'El nombre del fantasma es requerido.',
            'spawn_ghost.role.required_with'       => 'El rol del fantasma es requerido.',
            'spawn_ghost.role.in'                  => 'El rol debe ser: boss, secretary, intern o union.',
        ];
    }
}
