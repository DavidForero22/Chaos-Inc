<?php

namespace App\Http\Controllers;

use App\Services\UserService;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\UserResource;
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

        $response = Gate::inspect('update', $targetUser);

        if ($response->denied()) {
            return response()->json([
                'message' => $response->message()
            ], 403);
        }

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

        $response = Gate::inspect('delete', $targetUser);

        if ($response->denied()) {
            return response()->json([
                'message' => $response->message()
            ], 403);
        }

        $this->userService->deleteUser($id);
        return response()->noContent();
    }
}
