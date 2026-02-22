<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthService
{
    protected $userService;

    public function __construct(UserService $userService)
    {
        $this->userService = $userService;
    }

    public function register(array $data)
    {
        $data['role'] = 'user';
        $user = $this->userService->createUser($data);
        $token = $user->createToken('auth_token')->plainTextToken;

        return [$user, $token];
    }

    public function login(string $email, string $password)
    {
        $user = User::where('email', $email)->first();

        if (!$user || !Hash::check($password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The credentials provided are incorrect.'],
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return [$user, $token];
    }

    public function revokeCurrentToken($user)
    {
        return $user->currentAccessToken()->delete();
    }

    public function revokeAllTokens($user)
    {
        return $user->tokens()->delete();
    }
}
