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


    /**
     * Amigos donde yo envié la solicitud aceptada
     */
    public function friendsOfMine()
    {
        return $this->belongsToMany(User::class, 'friendships', 'sender_id', 'receiver_id')
            ->wherePivot('status', 'accepted')
            ->withTimestamps();
    }

    /**
     * Amigos donde yo recibí la solicitud aceptada
     */
    public function friendOf()
    {
        return $this->belongsToMany(User::class, 'friendships', 'receiver_id', 'sender_id')
            ->wherePivot('status', 'accepted')
            ->withTimestamps();
    }


    /**
     * Helper no-eager: útil en servicios cuando ya están cargadas ambas relaciones
     */
    public function getFriends(): \Illuminate\Support\Collection
    {
        return $this->friendsOfMine->merge($this->friendOf)->unique('id');
    }

    /**
     * Solicitudes que este usuario ha enviado
     */
    public function sentFriendRequests()
    {
        return $this->hasMany(Friendship::class, 'sender_id');
    }

    /** 
     *  Solicitudes que este usuario ha recibido
     */
    public function receivedFriendRequests()
    {
        return $this->hasMany(Friendship::class, 'receiver_id');
    }

    /**
     * Helper: comprueba si ya existe alguna relación con otro usuario
     */
    public function friendshipWith(User $user): ?Friendship
    {
        return Friendship::where(function ($q) use ($user) {
            $q->where('sender_id', $this->id)->where('receiver_id', $user->id);
        })->orWhere(function ($q) use ($user) {
            $q->where('sender_id', $user->id)->where('receiver_id', $this->id);
        })->first();
    }

    public function discoveredCards()
    {
        return $this->hasMany(UserDiscoveredCard::class);
    }
}
