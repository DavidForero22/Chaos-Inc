<?php
// app/Http/Controllers/AuthController.php

namespace App\Http\Controllers;

use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterUserRequest;
use Illuminate\Http\Request;
use App\Http\Resources\UserResource;
use App\Services\Auth\AuthService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    protected $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    public function me(Request $request)
    {
        return response()->json([
            'user' => new UserResource($request->user())
        ], 200);
    }

    public function register(RegisterUserRequest $request)
    {
        $user = $this->authService->register($request->validated());

        return response()->json([
            'user' => new UserResource($user),
            'message' => 'Usuario registrado correctamente. Por favor, inicie sesión.'
        ], 201);
    }

    public function login(LoginRequest $request)
    {
        // El núcleo de Laravel maneja la comprobación de contraseña y creación de sesión
        if (Auth::guard('web')->attempt($request->validated())) {

            // Regenerar la sesión es vital para evitar ataques
            $request->session()->regenerate();

            return response()->json([
                'user' => new UserResource(Auth::guard('web')->user()),
                'message' => 'Login successful'
            ], 200);
        }

        return response()->json(['message' => 'Credenciales incorrectas'], 401);
    }

    public function guestLogin(Request $request)
    {
        $request->validate([
            'username' => 'required|string|min:2|max:15'
        ]);

        $user = $this->authService->guestLogin($request->username);

        // EXCEPCIÓN OBLIGATORIA: Logueamos al invitado porque no sabe su contraseña generada
        Auth::guard('web')->login($user);
        $request->session()->regenerate();

        return response()->json([
            'user' => new UserResource($user),
            'message' => 'Invitado conectado.'
        ], 201);
    }

    public function logout(Request $request)
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Sesión cerrada correctamente'], 200);
    }

    public function logoutAll(Request $request)
    {
        $request->validate([
            'password' => 'required|string',
        ]);

        // Verificar contraseña
        if (!Hash::check($request->password, $request->user()->password)) {
            return response()->json([
                'message' => 'La contraseña proporcionada es incorrecta'
            ], 403);
        }

        Auth::logoutOtherDevices($request->password);
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'message' => 'Se han cerrado todas las sesiones en todos los dispositivos de forma segura'
        ], 200);
    }
}
