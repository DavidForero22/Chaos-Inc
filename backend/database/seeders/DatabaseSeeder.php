<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $adminPassword = env('SUPER_ADMIN_PASSWORD');

        // Creamos el Super Admin inicial
        User::create([
            'username' => 'SuperAdmin',
            'email' => 'admin@chaosinc.com',
            'password' => Hash::make($adminPassword),
            'role' => 'admin',
        ]);
    }
}