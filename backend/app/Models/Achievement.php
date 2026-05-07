<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Achievement extends Model
{
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'points',
    ];

    // Relación inversa: Un logro pertenece a muchos usuarios
    public function users()
    {
        return $this->belongsToMany(User::class, 'achievement_user')
            ->withPivot('unlocked_at')
            ->withTimestamps();
    }
}
