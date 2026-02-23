<?php

namespace App\Http\Requests\Room;

use Illuminate\Foundation\Http\FormRequest;

class LeaveRoomRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'player_name' => 'sometimes|string|max:255',
        ];
    }
}
