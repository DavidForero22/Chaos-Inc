<?php
// app/Models/UserDiscoveredCard.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserDiscoveredCard extends Model
{
    use HasFactory;

    public $timestamps = false; // Solo usa discovered_at

    protected $fillable = [
        'user_id',
        'card_id',
        'discovered_at',
    ];

    protected $casts = [
        'discovered_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function card(): BelongsTo
    {
        return $this->belongsTo(Card::class);
    }
}
