<?php
// App/Services/Admin/UserService.php

namespace App\Services\Admin;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\Encoders\WebpEncoder;
use Intervention\Image\ImageManager;

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

        // ─── LÓGICA DE SINCRONIZACIÓN DE AVATAR ───
        // Si el frontend pide sincronizar, borrar el avatar manual
        if (isset($data['sync_avatar']) && $data['sync_avatar'] === 'true') {
            if ($user->avatar) {
                Storage::disk('public')->delete($user->avatar);
            }
            $data['avatar'] = null; // Poner a null para que el frontend use el provider_avatar
        }

        // ─── PROCESAMIENTO DE SUBIDA DE AVATAR ───
        if (isset($data['avatar']) && $data['avatar'] instanceof \Illuminate\Http\UploadedFile) {

            // Borrar el avatar antiguo si existe y es local
            if ($user->avatar && !str_starts_with($user->avatar, 'http')) {
                Storage::disk('public')->delete($user->avatar);
            }

            // Inicializar Intervention
            $manager = ImageManager::usingDriver(Driver::class);

            // Leer, recortar a cuadrado perfecto (200x200) y convertir a WebP
            $image = $manager->decodeSplFileInfo($data['avatar']);
            $encodedImage = $image->cover(200, 200)->encode(new WebpEncoder(quality: 80));

            // Generar nombre único y guardar en storage/app/public/avatars
            $filename = 'avatars/' . $user->id . '_' . time() . '.webp';
            Storage::disk('public')->put($filename, (string) $encodedImage);

            // Asignar la ruta relativa a los datos que se guardarán en la BD
            $data['avatar'] = $filename;
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
