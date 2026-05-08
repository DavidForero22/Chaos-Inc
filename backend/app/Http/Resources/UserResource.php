<?php
// app/Http/Resources/UserResource.php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'       => $this->id,
            'username' => $this->username,
            'email'    => $this->email,
            'role'     => $this->role,
            'isGuest'  => $this->is_guest,
            'avatar'   => $this->avatar, 

            // Array de objetos de los proveedores conectados
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
