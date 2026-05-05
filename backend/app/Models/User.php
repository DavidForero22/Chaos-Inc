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
        'provider',
        'provider_id',
        'avatar',
        'provider_avatar',
    ];

    protected $hidden = ['password', 'remember_token'];

    public function games()
    {
        return $this->belongsToMany(Game::class)
            ->withPivot('has_won', 'role', 'damage_dealt', 'damage_received', 'cards_played', 'eliminations')
            ->withTimestamps();
    }

    /**
     * Indica si el usuario se registró mediante OAuth (no tiene contraseña propia).
     */
    public function isOAuthUser(): bool
    {
        return !is_null($this->provider);
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
