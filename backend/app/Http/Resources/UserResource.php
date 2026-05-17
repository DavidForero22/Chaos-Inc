<?php
// app/Http/Resources/UserResource.php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // ¿Quién está pidiendo los datos?
        $currentUser = $request->user();

        // ¿Tiene permiso para ver datos privados (email)?
        $canViewSensitiveData = $currentUser && (
            $currentUser->id === $this->id || $currentUser->role === 'admin'
        );

        return [
            'id'       => $this->id,
            'username' => $this->username,

            // El email solo viaja en el JSON si tiene permiso. 
            // Si no, la clave 'email' ni siquiera existirá en la respuesta.
            'email'    => $this->when($canViewSensitiveData, $this->email),

            'role'     => $this->role,
            'isGuest'  => $this->is_guest,
            'avatar'   => $this->avatar,
            'totalXp'  => $this->total_xp,

            'socialAccounts' => $this->whenLoaded('socialAccounts', function () {
                return $this->socialAccounts->map(function ($account) {
                    return [
                        'provider' => $account->provider_name,
                        'avatar'   => $account->provider_avatar,
                    ];
                });
            }),

            'joinedAt'     => $this->created_at->toIso8601String(),
            'games'        => GameResource::collection($this->whenLoaded('games')),
            'achievements' => $this->whenLoaded('achievements', function () {
                return $this->achievements->map(function ($ach) {
                    return [
                        'id'         => $ach->id,
                        'unlockedAt' => $ach->pivot->unlocked_at,
                    ];
                });
            }),
        ];
    }
}
