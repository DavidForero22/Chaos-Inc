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
            'admin_name'     => 'sometimes|string|max:255',
            'player_to_kick' => 'required|string|max:255',
        ];
    }

    public function messages(): array
    {
        return [
            'player_to_kick.required' => 'The player_to_kick field is required to kick a player.',
            'player_to_kick.string'   => "The name of the player to be sent off must be text.",
        ];
    }
}
