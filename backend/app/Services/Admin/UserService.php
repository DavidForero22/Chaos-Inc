<?php
// App/Services/Admin/UserService.php

namespace App\Services\Admin;

use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserService
{
    public function getAllUsers()
    {
        return User::all();
    }

    public function getUserById($id)
    {
        return User::findOrFail($id);
    }

    public function createUser(array $data)
    {

        $data['role'] = $data['role'] ?? 'user';

        return User::create($data);
    }

    public function updateUser($id, array $data)
    {
        $user = User::findOrFail($id);

        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }

        $user->update($data);
        return $user;
    }

    public function deleteUser($id)
    {
        $user = User::findOrFail($id);

        // Limpiar datos personales pero se mantiene la fila para las estadísticas
        $user->update([
            'username' => 'DeletedPlayer_' . $user->id,
            'email' => 'deleted_' . $user->id . '@example.com',
            'password' => 'anonimized',
        ]);

        return $user->delete();
    }
}
