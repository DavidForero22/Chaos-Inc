<?php
// App/Services/Admin/UserService.php

namespace App\Services\Admin;

use App\Models\User;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\Encoders\WebpEncoder;
use Intervention\Image\ImageManager;
use Illuminate\Support\Str;

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
        Log::info("Datos recibidos para actualizar el usuario", $data);
        $user = User::findOrFail($id);

        // EXTRAER CAMPOS DE ACCIÓN
        $unlinkGoogle       = Arr::pull($data, 'unlinkGoogle', false);
        $unlinkDiscord      = Arr::pull($data, 'unlinkDiscord', false);
        $resetAvatar        = Arr::pull($data, 'resetAvatar', false);
        $resetXp            = Arr::pull($data, 'resetXp', false);
        $activeAchievements = Arr::pull($data, 'activeAchievements');

        // SINCRONIZAR LOGROS CON FECHA (PIVOT)
        if (is_array($activeAchievements)) {
            $syncData = [];
            // Cargar los logros actuales para no sobrescribir su fecha original
            $currentAchievements = $user->achievements->keyBy('id');

            foreach ($activeAchievements as $achId) {
                if ($currentAchievements->has($achId)) {
                    // Si ya lo tenía, conservar su fecha
                    $syncData[$achId] = ['unlocked_at' => $currentAchievements->get($achId)->pivot->unlocked_at];
                } else {
                    // Si es un logro nuevo asignado por el admin, poner la fecha de hoy
                    $syncData[$achId] = ['unlocked_at' => now()];
                }
            }

            $user->achievements()->sync($syncData);
        }

        // PROCESAR ACCIONES DE SEGURIDAD Y PROGRESO
        if ($unlinkGoogle) {
            $user->socialAccounts()->where('provider_name', 'google')->delete();
        }

        if ($unlinkDiscord) {
            $user->socialAccounts()->where('provider_name', 'discord')->delete();
        }

        if ($resetAvatar) {
            $data['avatar'] = null;
        }

        if ($resetXp) {
            $data['total_xp'] = 0;
        }

        // ACTUALIZAR EL RESTO DE DATOS
        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }

        $user->update($data);

        return $user;
    }

    public function generateTempPassword($id)
    {
        $user = User::findOrFail($id);

        $rawPassword = Str::random(10);

        $user->update([
            'password' => Hash::make($rawPassword)
        ]);

        return $rawPassword;
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
        // Usar transacciones evita inconsistencias si algo falla a la mitad
        return DB::transaction(function () use ($id) {
            $user = User::findOrFail($id);

            // Limpiar datos personales 
            $user->update([
                'username' => 'DeletedPlayer_' . $user->id,
                'email'    => 'deleted_' . $user->id . '@example.com',
                'password' => 'anonimized',
                'avatar'   => null,
            ]);

            // Eliminar todas las vinculaciones sociales 
            $user->socialAccounts()->delete();
            $user->delete();

            return $user;
        });
    }

    /**
     * Obtiene el top 10 de usuarios registrados con más experiencia.
     */
    public function getTopTenUsers()
    {
        return User::select(['id', 'username', 'avatar', 'total_xp'])
            ->where('is_guest', false)
            ->orderBy('total_xp', 'desc')
            ->take(10)
            ->get();
    }
}
