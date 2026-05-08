<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SocialAccount extends Model
{
    protected $table = 'social_accounts';

    protected $fillable = [
        'user_id',
        'provider_name',
        'provider_id',
        'provider_avatar',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
