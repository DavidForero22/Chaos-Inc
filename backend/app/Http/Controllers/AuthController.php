<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\AuthService;
use App\Http\Requests\StoreUserRequest;
use App\Http\Resources\UserResource;

class AuthController extends Controller
{
    protected $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    public function register(StoreUserRequest $request)
    {
        list($user, $token) = $this->authService->register($request->validated());

        return response()->json([
            'user' => new UserResource($user),
            'token' => $token
        ], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        list($user, $token) = $this->authService->login($request->email, $request->password);

        return response()->json([
            'user' => new UserResource($user),
            'token' => $token
        ], 200);
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
