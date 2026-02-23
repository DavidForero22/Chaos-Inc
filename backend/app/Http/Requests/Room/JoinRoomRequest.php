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
            'player_name' => 'sometimes|string|max:255',
            'password'    => 'sometimes|string|nullable',
        ];
    }

    public function messages(): array
    {
        return [
            'player_name.string' => "The player's name must be text.",
        ];
    }
}
