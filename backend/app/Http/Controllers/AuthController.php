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
        // El Request ya ha validado que el email y username no existan
        $user = $this->userService->createUser($request->validated());

        // Generamos el token de Sanctum
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => new UserResource($user),
            'token' => $token
        ], 201);
    }

    public function login(Request $request)
    {
        // Validación rápida inline (podrías hacer un LoginRequest si prefieres)
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        // Comprobamos si el usuario existe y la contraseña (hasheada) coincide
        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Las credenciales proporcionadas son incorrectas.'
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
        // Revocamos el token que está usando actualmente para hacer la petición
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Sesión cerrada correctamente.'
        ], 200);
    }
}