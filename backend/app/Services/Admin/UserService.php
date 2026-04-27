<?php
// App/Services/Admin/UserService.php

namespace App\Services\Admin;

use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserService
{
    public function getAllUsers($perPage = 20, array $filters = [])
    {
        $query = User::query();

        // Filtro: Búsqueda por nombre
        if (!empty($filters['search'])) {
            $query->where('username', 'LIKE', '%' . $filters['search'] . '%');
        }

        // Filtro: Rol
        if (!empty($filters['role']) && $filters['role'] !== 'all') {
            if ($filters['role'] === 'guest') {
                $query->where('is_guest', true);
            } else {
                $query->where('role', $filters['role'])
                    ->where('is_guest', false);
            }
        }

        // Ordenación
        $sortField = $filters['sortField'] ?? 'username';
        $sortDir = (!empty($filters['sortDir']) && $filters['sortDir'] === 'desc') ? 'desc' : 'asc';

        // Mapeamos el campo del frontend ('joinedAt') a la columna real de la BD ('created_at')
        $dbField = $sortField === 'joinedAt' ? 'created_at' : 'username';

        $query->orderBy($dbField, $sortDir);

        return $query->paginate($perPage);
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
