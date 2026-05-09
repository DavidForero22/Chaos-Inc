<?php
// app/Http/Controllers/Admin/UserController.php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateAvatarRequest;
use App\Http\Requests\User\UpdateUserRequest;

use App\Http\Resources\UserResource;
use App\Services\Admin\UserService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class UserController extends Controller
{
    protected $userService;

    public function __construct(UserService $userService)
    {
        $this->userService = $userService;
    }

    public function index(Request $request)
    {
        $filters = $request->only(['search', 'role', 'sortField', 'sortDir']);

        $users = $this->userService->getAllUsers(20, $filters);

        return UserResource::collection($users);
    }

    public function store(StoreUserRequest $request)
    {
        $user = $this->userService->createUser($request->validated());
        return new UserResource($user);
    }

    public function show(Request $request, $id)
    {
        $user = $this->userService->getUserById($id);

        // Relaciones públicas (Partidas y Logros)
        $relationsToLoad = ['games.participants', 'games.cardUsages', 'achievements'];

        // Relaciones privadas (Cuentas sociales vinculadas)
        if ($request->user() && $request->user()->id == $id) {
            $relationsToLoad[] = 'socialAccounts';
        }

        $user->load($relationsToLoad);

        return new UserResource($user);
    }

    public function update(UpdateUserRequest $request, $id)
    {
        $authUser = $request->user();
        $targetUser = $this->userService->getUserById($id);

        // Solo admin o el propio usuario pueden editar
        if ($authUser->role !== 'admin' && $authUser->id !== $targetUser->id) {
            return response()->json(['message' => 'No tienes permiso para editar este perfil.'], 403);
        }

        $validated = $request->validated();

        // Eliminar del array cualquier campo que esté vacío o sea nulo
        $dataToUpdate = array_filter($validated, function ($value) {
            return $value !== null && $value !== '';
        });

        // Si después de limpiar los vacíos no queda nada por actualizar, devolver éxito sin hacer nada
        if (empty($dataToUpdate)) {
            return response()->json([
                'message' => 'No se detectaron cambios.',
                'user' => new UserResource($targetUser->load('socialAccounts'))
            ], 200);
        }

        $user = $this->userService->updateUser($id, $dataToUpdate);
        $user->load('socialAccounts');

        return response()->json([
            'message' => 'Perfil actualizado con éxito.',
            'user' => new UserResource($user)
        ], 200);
    }

    public function updateAvatar(UpdateAvatarRequest $request, $id)
    {
        $targetUser = $this->userService->getUserById($id);

        Gate::authorize('update', $targetUser);
        $user = $this->userService->updateAvatar($id, $request->validated());

        // Cargar las cuentas sociales para que el Resource devuelva toda la info
        $user->load('socialAccounts');

        return response()->json([
            'message' => 'Avatar actualizado con éxito.',
            'user' => new UserResource($user)
        ], 200);
    }

    public function destroy($id)
    {
        $targetUser = $this->userService->getUserById($id);

        Gate::authorize('delete', $targetUser);

        $this->userService->deleteUser($id);
        return response()->noContent();
    }

    public function unlinkSocialAccount(Request $request, $id, $provider)
    {
        $targetUser = $this->userService->getUserById($id);

        // Solo el propio usuario (o un admin) puede desvincular sus cuentas
        Gate::authorize('update', $targetUser);

        // Validar la contraseña si viene en la request
        $request->validate([
            'password' => 'sometimes|required|string|min:8'
        ]);

        try {
            // Pasar la contraseña al servicio (será null si no viene)
            $user = $this->userService->unlinkSocialAccount($id, $provider, $request->input('password'));
        } catch (\Exception $e) {
            if ($e->getMessage() === "PASSWORD_REQUIRED") {
                return response()->json([
                    'error_code' => 'PASSWORD_REQUIRED',
                    'message' => 'Para desvincular tu último método de acceso, primero debes establecer una contraseña.'
                ], 428); // 428 Precondition Required
            }

            // Cualquier otro error
            return response()->json(['message' => 'Error al desvincular la cuenta.'], 500);
        }

        // Recargamos relaciones para el Resource
        $user->load('socialAccounts');

        return response()->json([
            'message' => 'Cuenta desvinculada correctamente.',
            'user' => new UserResource($user)
        ], 200);
    }
}
