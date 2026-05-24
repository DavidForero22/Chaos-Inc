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
            ['id' => 'ach_win_intern'],
            ['id' => 'ach_win_secretary'],
            ['id' => 'ach_win_boss'],
            ['id' => 'ach_win_unionist'],
            ['id' => 'ach_last_unionist'],
            ['id' => 'ach_inherited_boss'],
            ['id' => 'ach_no_passives'],
            ['id' => 'ach_triple_kill'],
            ['id' => 'ach_failed_mass_attack'],
            ['id' => 'ach_play_10'],
            ['id' => 'ach_play_25'],
            ['id' => 'ach_gitana_luck'],
            ['id' => 'ach_no_defense'],
            ['id' => 'ach_one_hp_clutch'],
        ];

        DB::table('achievements')->insertOrIgnore($achievements);
    }
}
