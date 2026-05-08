<?php
// app/Models/User.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\SoftDeletes;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'username',
        'email',
        'password',
        'role',
        'is_guest',
        'avatar',
    ];

    protected $hidden = ['password', 'remember_token'];

    public function socialAccounts()
    {
        return $this->hasMany(SocialAccount::class);
    }

    public function games()
    {
        return $this->belongsToMany(Game::class)
            ->withPivot('is_guest', 'display_name', 'has_won', 'role', 'is_dead', 'damage_dealt', 'damage_received', 'healing_done', 'cards_played', 'passives_played', 'eliminations', 'dodged_attacks', 'cards_stolen')
            ->withTimestamps();
    }

    // Relación con los logros 
    public function achievements()
    {
        return $this->belongsToMany(Achievement::class, 'achievement_user')
            ->withPivot('unlocked_at')
            ->withTimestamps();
    }

    // Relación directa con el uso de cartas
    public function cardUsages()
    {
        return $this->hasMany(GameCardUsage::class);
    }

    /**
     * Indica si el usuario se registró mediante OAuth comprobando si tiene cuentas vinculadas.
     */
    public function isOAuthUser(): bool
    {
        return $this->socialAccounts()->exists();
    }

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
            'is_guest'          => 'boolean',
        ];
    }
}
