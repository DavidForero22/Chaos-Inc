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
        $targetUser = $this->userService->getUserById($id);

        Gate::authorize('update', $targetUser);

        // Validar que el usuario no cambia su propio rol
        if ($request->has('role') && $request->user()->id === $targetUser->id) {
            return response()->json([
                'message' => 'You are not allowed to change your own role.'
            ], 403);
        }

        $user = $this->userService->updateUser($id, $request->validated());

        return response()->json([
            'message' => 'Profile updated successfully',
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

        $user = $this->userService->unlinkSocialAccount($id, $provider);

        // Recargamos relaciones para el Resource
        $user->load('socialAccounts');

        return response()->json([
            'message' => 'Cuenta desvinculada correctamente.',
            'user' => new UserResource($user)
        ], 200);
    }
}
