<?php
// routes/console.php

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Models\User;

/**
 * Purgar invitados expirados (Con Anonimización y Soft Delete)
 * @return int Número de usuarios borrados
 */
$purgeGuestsTask = function () {
    // Definir el límite (invitados con más de 24 horas)
    $expiredGuests = User::where('is_guest', true)
        ->where('created_at', '<', now()->subDay())
        ->get();

    $count = $expiredGuests->count();

    foreach ($expiredGuests as $guest) {

        // Limpiar cualquier sesión activa en la base de datos 
        DB::table('sessions')->where('user_id', $guest->id)->delete();

        // Anonimanizar los datos para mantener el historial del juego intacto
        $guest->update([
            'username' => 'DeletedGuest_' . $guest->id,
            'email'    => 'deleted_guest_' . $guest->id . '_' . time() . '@example.com',
            'password' => Hash::make(Str::random(32)),
        ]);

        // Apilcar Borrado Suave (Soft Delete)
        $guest->delete();
    }

    return $count;
};

// COMANDO MANUAL
Artisan::command('guests:purge', function () use ($purgeGuestsTask) {
    $this->info("Iniciando purga manual de invitados...");

    $count = $purgeGuestsTask();

    if ($count <= 0) {
        $this->info("No había invitados antiguos para eliminar.");
    } else {
        $this->info("Limpieza completada: Se han anonimizado y archivado {$count} invitados antiguos.");
    }
})->purpose('Anonimiza y archiva invitados con más de 24h de antigüedad');


// TAREA PROGRAMADA (Cada hora)
Schedule::call($purgeGuestsTask)
    ->hourly()
    ->name('purge-guests');
