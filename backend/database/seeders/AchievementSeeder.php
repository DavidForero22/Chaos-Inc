<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AchievementSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $achievements = [
            ['id' => 'ach_win_intern', 'points' => 10],
            ['id' => 'ach_win_secretary', 'points' => 10],
            ['id' => 'ach_win_boss', 'points' => 10],
            ['id' => 'ach_win_unionist', 'points' => 10],
            ['id' => 'ach_last_unionist', 'points' => 20],
            ['id' => 'ach_inherited_boss', 'points' => 20],
            ['id' => 'ach_no_passives', 'points' => 30],
            ['id' => 'ach_triple_kill', 'points' => 40],
            ['id' => 'ach_failed_mass_attack', 'points' => 15],
            ['id' => 'ach_play_10', 'points' => 10],
            ['id' => 'ach_play_25', 'points' => 25],
            ['id' => 'ach_gitana_luck', 'points' => 50],
            ['id' => 'ach_no_defense', 'points' => 30],
            ['id' => 'ach_one_hp_clutch', 'points' => 40],
        ];

        // Usar insertOrIgnore para que si ejecutamos el seeder varias veces, 
        // no dé error de clave duplicada.
        DB::table('achievements')->insertOrIgnore($achievements);
    }
}
