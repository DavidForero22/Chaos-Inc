<?php
// app/Http/Controllers/Admin/UserController.php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Services\Admin\UserService;
use Illuminate\Support\Facades\Gate;

class UserController extends Controller
{
    protected $userService;

    public function __construct(UserService $userService)
    {
        $this->userService = $userService;
    }

    public function index()
    {
        $users = $this->userService->getAllUsers();
        return UserResource::collection($users);
    }

    public function store(StoreUserRequest $request)
    {
        $user = $this->userService->createUser($request->validated());
        return new UserResource($user);
    }

    public function show($id)
    {
        $user = $this->userService->getUserById($id);
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

    public function destroy($id)
    {
        $targetUser = $this->userService->getUserById($id);

        Gate::authorize('delete', $targetUser);

        $this->userService->deleteUser($id);
        return response()->noContent();
    }
}
