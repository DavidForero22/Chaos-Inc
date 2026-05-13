<?php
// App/Services/Admin/UserService.php

namespace App\Services\Admin;

use App\Models\User;
use Exception;
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

        $user->update($data);
        return $user;
    }

    public function updateAvatar($id, array $data)
    {
        $user = User::findOrFail($id);

        // Helper para borrar la foto local anterior y no llenar el servidor de basura
        $deleteOldLocalAvatar = function () use ($user) {
            if ($user->avatar && !str_starts_with($user->avatar, 'http')) {
                Storage::disk('public')->delete($user->avatar);
            }
        };

        // OPCIÓN A: El usuario ha elegido usar el avatar de Google/Discord
        if (!empty($data['provider'])) {
            $socialAccount = $user->socialAccounts()->where('provider_name', $data['provider'])->first();

            if ($socialAccount && $socialAccount->provider_avatar) {
                $deleteOldLocalAvatar();
                // Poner la URL directa de Discord/Google como su avatar oficial
                $user->update(['avatar' => $socialAccount->provider_avatar]);
            }
            return $user;
        }

        // OPCIÓN B: El usuario ha subido un archivo manualmente
        if (isset($data['avatar']) && $data['avatar'] instanceof \Illuminate\Http\UploadedFile) {
            $deleteOldLocalAvatar();

            $manager = ImageManager::usingDriver(Driver::class);
            $image = $manager->decodeSplFileInfo($data['avatar']);
            $encodedImage = $image->cover(200, 200)->encode(new WebpEncoder(quality: 80));

            $filename = 'avatars/' . $user->id . '_' . time() . '.webp';
            Storage::disk('public')->put($filename, (string) $encodedImage);

            $user->update(['avatar' => $filename]);
        }

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

        $user->socialAccounts()->delete();
        return $user->delete();
    }

    public function unlinkSocialAccount($id, string $provider, ?string $password = null)
    {
        $user = User::findOrFail($id);
        $socialAccount = $user->socialAccounts()->where('provider_name', $provider)->first();

        if ($socialAccount) {
            $isLastAccount = $user->socialAccounts()->count() === 1;
            $hasNoPassword = is_null($user->password);

            if ($isLastAccount && $hasNoPassword) {
                if (empty($password)) {
                    throw new Exception("PASSWORD_REQUIRED");
                }
                // Si envia la contraseña, guardar antes de desvincular
                $user->update(['password' => Hash::make($password)]);
            }
            // ---------------------------------

            // Comprobar si el usuario estaba usando el avatar de este proveedor
            if ($user->avatar === $socialAccount->provider_avatar) {
                $user->update(['avatar' => null]);
            }

            // Eliminar la vinculación
            $socialAccount->delete();
        }

        return $user;
    }
}
