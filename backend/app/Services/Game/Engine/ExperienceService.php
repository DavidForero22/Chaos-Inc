<?php
// app/Services/ExperienceService.php

namespace App\Services\Game\Engine;

use App\Models\User;

class ExperienceService
{
    // -------------------------------------------------------------------------
    // Constantes de XP por evento
    // -------------------------------------------------------------------------
    const XP_WIN         = 100; // Victoria
    const XP_LOSS        = 30;  // Derrota
    const XP_ELIMINATION = 20;  // Por cada eliminación
    const XP_MVP         = 15;  // Jugador con más daño en la partida

    // -------------------------------------------------------------------------
    // Constantes de la curva de niveles
    // -------------------------------------------------------------------------
    const LEVEL_BASE     = 50;  // Multiplicador base de la fórmula
    const LEVEL_EXPONENT = 1.5; // Exponente de crecimiento
    const MAX_LEVEL      = 50;

    // -------------------------------------------------------------------------
    // Lógica de niveles (pública para poder usarla en el perfil)
    // -------------------------------------------------------------------------

    /**
     * XP necesario para subir AL nivel N (el coste de ese escalón concreto).
     */
    public static function xpRequiredForLevel(int $level): int
    {
        return (int) round(self::LEVEL_BASE * pow($level, self::LEVEL_EXPONENT));
    }

    /**
     * Calcula el nivel actual dado un total de XP acumulado.
     */
    public static function levelFromXp(int $totalXp): int
    {
        $level       = 1;
        $accumulated = 0;

        while ($level < self::MAX_LEVEL) {
            $cost = self::xpRequiredForLevel($level);

            if ($accumulated + $cost > $totalXp) {
                break;
            }

            $accumulated += $cost;
            $level++;
        }

        return $level;
    }

    /**
     * XP acumulado total necesario para ESTAR en el nivel N.
     * Útil para barras de progreso en el perfil.
     */
    public static function totalXpForLevel(int $level): int
    {
        $total = 0;

        for ($i = 1; $i < $level; $i++) {
            $total += self::xpRequiredForLevel($i);
        }

        return $total;
    }

    // -------------------------------------------------------------------------
    // Cálculo y persistencia al final de partida
    // -------------------------------------------------------------------------

    /**
     * Devuelve el player_id del jugador con más daño causado.
     * Si nadie hizo daño (damage_dealt = 0 en todos), no hay MVP.
     */
    public function resolveMvp(array $playersData): ?string
    {
        $topDamage = 0;
        $mvpId     = null;

        foreach ($playersData as $player) {
            if ($player['damage_dealt'] > $topDamage) {
                $topDamage = $player['damage_dealt'];
                $mvpId     = $player['player_id'];
            }
        }

        return $mvpId;
    }

    /**
     * Calcula, persiste y devuelve el resumen de XP de UN jugador.
     */
    public function processPlayer(array $player, ?string $mvpPlayerId): array
    {
        $isMvp   = $mvpPlayerId !== null && $player['player_id'] === $mvpPlayerId;

        $xpBase  = $player['has_won'] ? self::XP_WIN : self::XP_LOSS;
        $xpElims = $player['eliminations'] * self::XP_ELIMINATION;
        $xpMvp   = $isMvp ? self::XP_MVP : 0;
        $xpTotal = $xpBase + $xpElims + $xpMvp;

        $newTotalXp = null;
        if (!$player['is_guest']) {
            $newTotalXp = $this->persistXp((int) $player['user_id'], $xpTotal);
        }

        return $this->buildSummary(
            player: $player,
            xpBase: $xpBase,
            xpElims: $xpElims,
            xpMvp: $xpMvp,
            xpTotal: $xpTotal,
            newTotalXp: $newTotalXp,
        );
    }

    // -------------------------------------------------------------------------
    // Helpers privados
    // -------------------------------------------------------------------------

    /**
     * Suma XP al total del usuario directamente en BD.
     * Usamos increment() para evitar race conditions si hubiera
     * dos partidas finalizando a la vez para el mismo usuario.
     */
    private function persistXp(int $userId, int $xp): int
    {
        User::where('id', $userId)
            ->where('is_guest', false)
            ->increment('total_xp', $xp);

        return (int) User::where('id', $userId)->value('total_xp');
    }

    /**
     * Construye el resumen de XP listo para serializar en el evento.
     */
    private function buildSummary(
        array $player,
        int   $xpBase,
        int   $xpElims,
        int   $xpMvp,
        int   $xpTotal,
        ?int  $newTotalXp,
    ): array {
        $level        = $newTotalXp !== null ? self::levelFromXp($newTotalXp) : null;
        $currentFloor = $newTotalXp !== null ? self::totalXpForLevel($level) : null;
        $nextFloor    = $newTotalXp !== null ? self::totalXpForLevel($level + 1) : null;

        return [
            'breakdown' => [
                'base'         => $xpBase,        // XP por victoria o derrota
                'eliminations' => [
                    'count' => $player['eliminations'],
                    'xp'    => $xpElims,
                ],
                'mvp'          => $xpMvp,         // 0 si no fue MVP
            ],
            'total_earned'     => $xpTotal,
            // null para guests — el frontend decide qué mostrar
            'account' => $newTotalXp !== null ? [
                'total_xp'       => $newTotalXp,
                'level'          => $level,
                'xp_current'     => $newTotalXp - $currentFloor,  // XP dentro del nivel actual
                'xp_needed'      => $nextFloor - $currentFloor,   // Coste total del nivel actual
            ] : null,
        ];
    }
}
