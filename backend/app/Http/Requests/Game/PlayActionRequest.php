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
            'target_id' => 'required|string',
            'perk_key' => 'nullable|string|in:has_shield,vision_bonus,has_distance,has_storage,has_luck,has_potato_launcher',
        ];
    }

    /**
     * Mensajes de error personalizados para la validación.
     */
    public function messages(): array
    {
        return [
            'card_id.required'     => 'Es necesario identificar la carta para realizar la acción.',
            'card_id.string'       => 'El identificador de la carta no es válido.',

            'target_id.required' => 'Debes seleccionar a un empleado objetivo.',
            'target_id.integer'   => 'El id del objetivo debe ser una número válido.',

            'perk_key.string'      => 'El identificador del perk no es válido.',
            'perk_key.in'          => 'El perk seleccionada no existe o no puede ser anulada.',
        ];
    }
}
