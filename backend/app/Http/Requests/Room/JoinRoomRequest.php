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
            'password'    => 'sometimes|string|nullable',
        ];
    }
}
