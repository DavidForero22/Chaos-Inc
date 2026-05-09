<?php
// app/Services/Game/AchievementService.php

namespace App\Services\Game\Engine;

use App\Models\User;

class AchievementService
{
    /**
     * Evalúa los logros de final de partida para todos los jugadores.
     */
    public function evaluateEndGameAchievements(array $playersData, int $totalPlayers): array
    {
        $achievementsUnlocked = [];

        // Contar cuántos sindicalistas vivos quedaron para el logro "Solo ante el Peligro"
        $aliveUnionistsCount = 0;
        foreach ($playersData as $p) {
            if ($p['role'] === 'union' && !$p['is_dead']) {
                $aliveUnionistsCount++;
            }
        }

        foreach ($playersData as $player) {
            // Ignorar a los invitados, no pueden tener logros
            if ($player['is_guest'] || empty($player['user_id'])) {
                continue;
            }

            $user = User::find($player['user_id']);
            if (!$user) continue;

            $achievementsToUnlock = [];

            // Solo evaluar si el jugador HA GANADO
            if ($player['has_won']) {
                $role = $player['role'];
                $isActingBoss = $player['acting_boss'] ?? false;

                // 1. Becario (Si ganó y no fue ascendido a jefe)
                if ($role === 'intern' && !$isActingBoss) {
                    $achievementsToUnlock[] = 'ach_win_intern';
                }

                // 2. Secretario (Si ganó y no fue ascendido a jefe)
                if ($role === 'secretary' && !$isActingBoss) {
                    $achievementsToUnlock[] = 'ach_win_secretary';
                }

                // 3. Jefe original
                if ($role === 'boss') {
                    $achievementsToUnlock[] = 'ach_win_boss';
                }

                // 4. Sindicalista
                if ($role === 'union') {
                    $achievementsToUnlock[] = 'ach_win_unionist';
                }

                // 5. Solo ante el peligro (Último sindicalista en partida llena)
                if ($role === 'union' && !$player['is_dead'] && $aliveUnionistsCount === 1 && $totalPlayers === 6) {
                    $achievementsToUnlock[] = 'ach_last_unionist';
                }

                // 6. Heredero del Poder (Becario o Secretario que terminó como Jefe)
                if ($isActingBoss) {
                    $achievementsToUnlock[] = 'ach_inherited_boss';
                }
            }

            // Desbloquear los logros en SQL (solo los nuevos)
            if (!empty($achievementsToUnlock)) {
                $alreadyUnlocked = $user->achievements()
                    ->whereIn('achievements.id', $achievementsToUnlock)
                    ->pluck('achievements.id')
                    ->all();

                $newUnlocks = array_values(array_diff($achievementsToUnlock, $alreadyUnlocked));

                if (!empty($newUnlocks)) {
                    $syncData = [];
                    foreach ($newUnlocks as $achId) {
                        $syncData[$achId] = ['unlocked_at' => now()];
                        $achievementsUnlocked[] = [
                            'playerId' => $player['player_id'],
                            'achievementId' => $achId,
                        ];
                    }

                    $user->achievements()->syncWithoutDetaching($syncData);
                }
            }
        }

        return $achievementsUnlocked;
    }
}
