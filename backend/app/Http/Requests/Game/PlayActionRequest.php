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
            // Identificador de instancia de carta (string único generado en el servidor)
            'card_id' => 'required|string',
            'target_name' => 'required|string',
            'perk_key'    => 'nullable|string|in:has_shield,vision_bonus,distance_bonus',
        ];
    }
}
