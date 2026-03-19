<?php

namespace App\Support;

class LiveGameHelper
{
    public static function generateRolesDistribution(int $count): array
    {
        $roleTable = [
            3 => ['boss' => 1, 'secretary' => 0, 'intern' => 1, 'union' => 1],
            4 => ['boss' => 1, 'secretary' => 1, 'intern' => 1, 'union' => 1],
            5 => ['boss' => 1, 'secretary' => 1, 'intern' => 1, 'union' => 2],
            6 => ['boss' => 1, 'secretary' => 1, 'intern' => 1, 'union' => 3],
        ];

        $distribution = $roleTable[$count] ?? $roleTable[6];
        $roles = [];

        foreach ($distribution as $role => $amount) {
            for ($i = 0; $i < $amount; $i++) {
                $roles[] = $role;
            }
        }

        return $roles;
    }
}
