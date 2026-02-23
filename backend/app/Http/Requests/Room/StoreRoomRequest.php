<?php

namespace App\Http\Requests\Room;

use Illuminate\Foundation\Http\FormRequest;

class StoreRoomRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:20',
            'max_players' => 'required|integer|min:2|max:6',
            'is_private' => 'required|boolean',
            'password' => 'required_if:is_private,true'
        ];
    }
}
