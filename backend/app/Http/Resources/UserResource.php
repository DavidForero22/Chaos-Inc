<?php
// app/Http/Resources/UserResource.php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'username' => $this->username,
            'email' => $this->email,
            'role' => $this->role,
            'isGuest' => $this->is_guest,
            'avatar' => $this->avatar,
            'provider' => $this->provider,
            'joinedAt' => $this->created_at->toIso8601String(),
            'games' => GameResource::collection($this->whenLoaded('games')),
        ];
    }
}
