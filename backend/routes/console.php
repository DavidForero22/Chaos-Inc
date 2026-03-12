<?php
// routes/console.php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Models\User;

/**
 * Purgar invitados expirados
 * @return int Número de usuarios borrados
 */
$purgeGuestsTask = function () {
    // Definimos el límite (invitados con más de 24 horas)
    $expiredGuests = User::where('is_guest', true)
        ->where('created_at', '<', now()->subDay())
        ->get();

    $count = $expiredGuests->count();

    foreach ($expiredGuests as $guest) {
        $guest->tokens()->delete();
        $guest->forceDelete();
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
        $this->info("Limpieza completada: Se han eliminado {$count} invitados antiguos.");
    }
})->purpose('Elimina invitados con más de 24h de antigüedad');


// TAREA PROGRAMADA (Cada hora)
Schedule::call($purgeGuestsTask)
    ->hourly()
    ->name('purge-guests');
