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

                // 1. Becaria (Si ganó y no fue ascendido a jefe)
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

                // 4. Sindicato
                if ($role === 'union') {
                    $achievementsToUnlock[] = 'ach_win_unionist';
                }

                // 5. Solo ante el peligro (Último sindicalista en partida llena)
                if ($role === 'union' && !$player['is_dead'] && $aliveUnionistsCount === 1 && $totalPlayers === 6) {
                    $achievementsToUnlock[] = 'ach_last_unionist';
                }

                // 6. Heredero del Poder (Becaria o Secretario que terminó como Jefe)
                if ($isActingBoss) {
                    $achievementsToUnlock[] = 'ach_inherited_boss';
                }

                // 7. Sin Bolsillos (Ganar sin equipar pasivas)
                if ((int)($player['passive_equipped'] ?? 0) === 0) {
                    $achievementsToUnlock[] = 'ach_no_passives';
                }

                // 9. Pecho de Hierro (Ganar sin esquivar ni bloquear con escudo)
                if ((int)($player['dodged_or_defended'] ?? 0) === 0) {
                    $achievementsToUnlock[] = 'ach_no_defense';
                }

                // 10. Invencible (Ganar con 1 HP restante)
                if ((int)($player['remaining_hp'] ?? 0) === 1) {
                    $achievementsToUnlock[] = 'ach_one_hp';
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

    /**
     * Evalúa logros que se desbloquean en mitad de la partida.
     * Devuelve los IDs de los logros recién desbloqueados (para notificar).
     */
    public function evaluateMidGameAchievements(int $userId, array $context): array
    {
        $user = User::find($userId);
        if (!$user) return [];

        $unlocked = [];

        // Suerte del Principiante: racha de 3+ robos extra con Suerte
        if (($context['luck_streak'] ?? 0) >= 3) {
            $achievementId = 'ach_luck';
            $alreadyHas = $user->achievements()
                ->where('achievements.id', $achievementId)
                ->exists();

            if (!$alreadyHas) {
                $user->achievements()->attach($achievementId, ['unlocked_at' => now()]);
                $unlocked[] = $achievementId;
            }
        }


        return $unlocked;
    }
}

