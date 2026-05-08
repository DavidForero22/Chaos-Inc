<?php
// app/Http/Requests/User/UpdateAvatarRequest.php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAvatarRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'avatar' => 'sometimes|image|mimes:jpeg,png,jpg,webp|max:2048',
            'provider' => 'sometimes|string|in:google,discord',
        ];
    }

    public function messages(): array
    {
        return [
            'avatar.image' => 'El avatar debe ser un archivo de imagen.',
            'avatar.mimes' => 'Solo se admiten formatos JPEG, PNG, JPG y WEBP.',
            'avatar.max'   => 'El avatar no puede superar los 2MB.',
            'provider.in'  => 'El proveedor seleccionado no es válido.',
        ];
    }
}
