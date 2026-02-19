<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Room extends Model
{
    protected $fillable = [
        'creator_id',
        'name',
        'is_private',
        'password',
        'status',
        'max_players',
        'turn_timeout'
    ];

    // Relación: La sala pertenece a un creador (Usuario)
    public function creator()
    {
        return $this->belongsTo(User::class, 'creator_id');
    }
}
