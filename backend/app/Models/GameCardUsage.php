<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GameCardUsage extends Model
{
    // Laravel por defecto buscaría la tabla "game_card_usages", 
    // así que le especifico el nombre correcto de la tabla.
    protected $table = 'game_card_usage';

    protected $fillable = [
        'game_id',
        'user_id',
        'card_id',
        'times_played',
    ];

    // Un registro de uso pertenece a una partida
    public function game()
    {
        return $this->belongsTo(Game::class);
    }

    // Un registro de uso pertenece a un usuario
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function card()
    {
        return $this->belongsTo(Card::class);
    }
}
