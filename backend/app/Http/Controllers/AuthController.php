<?php

namespace App\Http\Controllers;

use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterUserRequest;
use Illuminate\Http\Request;
use App\Services\AuthService;
use App\Http\Resources\UserResource;

class AuthController extends Controller
{
    protected $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    public function register(RegisterUserRequest $request)
    {
        [$user, $token] = $this->authService->register($request->validated());

        return response()->json([
            'user' => new UserResource($user),
            'token' => $token
        ], 201);
    }

    public function login(LoginRequest $request)
    {
        [$user, $token] = $this->authService->login($request->validated());

        return response()->json([
            'user' => new UserResource($user),
            'token' => $token
        ], 200);
    }

    public function guestLogin(Request $request)
    {
        $request->validate([
            'username' => 'required|string|min:2|max:15'
        ]);

        [$user, $token] = $this->authService->guestLogin($request->username);

        return response()->json([
            'user' => new UserResource($user),
            'token' => $token
        ], 201);
    }

    public function logout(Request $request)
    {
        $this->authService->revokeCurrentToken($request->user());

        return response()->json(['message' => 'Session closed successfully.'], 200);
    }

    public function logoutAll(Request $request)
    {
        $this->authService->revokeAllTokens($request->user());

        return response()->json([
            'message' => 'Successfully logged out from all devices and sessions.'
        ], 200);
    }
}
