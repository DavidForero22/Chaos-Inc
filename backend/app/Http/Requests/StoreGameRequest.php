<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreGameRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Validación de la tabla 'games'
            'winner_role' => 'required|in:boss,secretary,intern,union',
            'total_rounds' => 'required|integer|min:1',
            'total_eliminations' => 'required|integer|min:0',

            // Validación del array de jugadores para la tabla pivote 'game_user'
            'players' => 'required|array|min:2', // Al menos 2 jugadores
            'players.*.user_id' => 'required|exists:users,id',
            'players.*.has_won' => 'required|boolean',
            'players.*.role' => 'required|in:boss,secretary,intern,union',
            'players.*.damage_dealt' => 'required|integer|min:0',
            'players.*.damage_received' => 'required|integer|min:0',
            'players.*.cards_played' => 'required|integer|min:0',
            'players.*.eliminations' => 'required|integer|min:0',
        ];
    }

    public function messages(): array
    {
        return [
            'winner_role.required' => 'The winning role must be specified.',
            'winner_role.in' => 'The winning role must be one of: boss, secretary, intern, or union.',
            'total_rounds.required' => 'The total number of rounds is required.',
            'total_rounds.min' => 'The game must have lasted at least 1 round.',
            'total_eliminations.min' => 'Total eliminations cannot be negative.',

            'players.required' => 'Game data must include the players.',
            'players.min' => 'A game requires at least 2 players.',

            'players.*.user_id.exists' => 'One or more provided player IDs do not exist in the database.',
            'players.*.role.in' => 'One or more players have an invalid role assigned.',
            'players.*.damage_dealt.min' => 'Damage dealt cannot be a negative number.',
            'players.*.damage_received.min' => 'Damage received cannot be a negative number.',
            'players.*.cards_played.min' => 'Cards played cannot be a negative number.',
            'players.*.eliminations.min' => 'Eliminations cannot be a negative number.',
        ];
    }
}
