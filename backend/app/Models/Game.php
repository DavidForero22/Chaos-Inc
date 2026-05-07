<?php
// app/Models/Game.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Game extends Model
{
    protected $fillable = ['winner_role', 'total_rounds', 'total_eliminations'];

    // Relación: Una partida tiene muchos usuarios participantes
    public function users()
    {
        return $this->belongsToMany(User::class)
            ->withPivot('is_guest', 'display_name', 'has_won', 'role', 'is_dead', 'damage_dealt', 'damage_received', 'healing_done', 'cards_played', 'passives_played', 'eliminations')
            ->withTimestamps();
    }

    // Todos los participantes incluyendo invitados (acceso directo al pivot)
    public function participants()
    {
        return $this->hasMany(GameUser::class);
    }

    public function cardUsages()
    {
        return $this->hasMany(GameCardUsage::class);
    }
}
