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
        'is_dead',
        'damage_dealt',
        'damage_received',
        'healing_done',
        'cards_played',
        'passives_played',
        'eliminations',
        'dodged_attacks',
        'cards_stolen',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
