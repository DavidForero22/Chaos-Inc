<?php
// app/Models/Card.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Card extends Model
{
    public $incrementing = false;
    protected $keyType = 'integer';

    protected $fillable = [
        'id',
        'base_name',
        'type',
        'category',
    ];

    // Una carta puede ser usada en muchas partidas
    public function usages(): HasMany
    {
        return $this->hasMany(GameCardUsage::class);
    }

    // Una carta puede ser descubierta por muchos usuarios
    public function discoveries(): HasMany
    {
        return $this->hasMany(UserDiscoveredCard::class);
    }
}
