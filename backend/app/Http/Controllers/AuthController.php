<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Services\UserService;
use App\Http\Requests\StoreUserRequest;
use App\Http\Resources\UserResource;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    protected $userService;

    public function __construct(UserService $userService)
    {
        $this->userService = $userService;
    }

    public function register(StoreUserRequest $request)
    {
        $validatedData = $request->validated();
        $validatedData['role'] = 'user';

        $user = $this->userService->createUser($validatedData);
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => new UserResource($user),
            'token' => $token
        ], 201);
    }

    public function login(Request $request)
    {
        // Validación rápida inline
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        // Comprobar si el usuario existe y la contraseña (hasheada) coincide
        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'The credentials provided are incorrect.'
            ], 401);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => new UserResource($user),
            'token' => $token
        ], 200);
    }

    public function logout(Request $request)
    {
        // Revocar el token que está usando actualmente para hacer la petición
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Session closed successfully.'
        ], 200);
    }
}
