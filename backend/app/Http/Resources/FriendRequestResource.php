<?php
// app/Http/Resources/FriendRequestResource.php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FriendRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $currentUser = $request->user();

        // Dependiendo de si soy el sender o el receiver, el "otro usuario" cambia
        $isSender   = $this->sender_id === $currentUser->id;
        $otherUser  = $isSender ? $this->whenLoaded('receiver') : $this->whenLoaded('sender');

        return [
            'id'        => $this->id,
            'status'    => $this->status,
            'createdAt' => $this->created_at->toIso8601String(),
            'direction' => $isSender ? 'sent' : 'received',
            'user'      => $this->when($otherUser !== null, function () use ($isSender) {
                $other = $isSender ? $this->receiver : $this->sender;
                return [
                    'id'       => $other->id,
                    'username' => $other->username,
                    'avatar'   => $other->avatar,
                    'totalXp'  => $other->total_xp,
                ];
            }),
        ];
    }
}
