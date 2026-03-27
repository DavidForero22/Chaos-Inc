<?php
// app/Models/GameUser.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GameUser extends Model
{
    protected $table = 'game_user';

    protected $fillable = [
        'game_id',
        'user_id',
        'is_guest',
        'display_name',
        'has_won',
        'role',
        'damage_dealt',
        'damage_received',
        'cards_played',
        'eliminations',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
