<?php
// app/Services/Auth/TokenService.php

namespace App\Services\Auth;

use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;

class TokenService
{
    public function refreshPlayerToken(string $roomId, string $playerName): string
    {
        $this->deletePlayerToken($roomId, $playerName);

        $gameToken = (string) Str::uuid();
        Redis::setex("room:{$roomId}:token:{$gameToken}", 86400, $playerName);
        return $gameToken;
    }

    public function deletePlayerToken(string $roomId, string $playerName): void
    {
        $prefix = config('database.redis.options.prefix', '');
        $tokenKeys = Redis::keys("room:{$roomId}:token:*");

        foreach ($tokenKeys as $key) {
            $cleanKey = str_replace($prefix, '', $key);
            if (Redis::get($cleanKey) === $playerName) {
                Redis::del($cleanKey);
            }
        }
    }
}
