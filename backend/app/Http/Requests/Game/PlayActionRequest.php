<?php

namespace App\Http\Requests\Game;

use Illuminate\Foundation\Http\FormRequest;

class PlayActionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'card_id' => 'required|integer',
            'target_name' => 'required|string',
        ];
    }
}
