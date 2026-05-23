<?php
// app/Services/Admin/AnalyticsService.php

namespace App\Services\Admin;

use App\Models\Game;
use App\Models\GameCardUsage;
use App\Models\User;
use App\Models\SocialAccount;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class AnalyticsService
{
    /**
     * Obtiene todos los datos del dashboard de analíticas.
     *
     * @param int $days Días hacia atrás para crecimiento y heatmap (0 = todo)
     * @return array
     */
    public function getDashboardData(int $days = 30): array
    {
        $cacheKey = "admin:analytics:dashboard:{$days}";
        // Cache por 10 minutos (600 segundos)
        return Cache::remember($cacheKey, 600, function () use ($days) {
            return [
                'win_rate'       => $this->getWinRate(),
                'top_cards'      => $this->getTopCards(),
                'user_growth'    => $this->getUserGrowth($days),
                'social_auth'    => $this->getSocialAuthStats(),
                'sessions_hourly' => $this->getSessionsByHour($days),
            ];
        });
    }

    /**
     * Tasa de victorias por rol (incluye canceladas).
     */
    private function getWinRate(): array
    {
        $total = Game::count();
        if ($total === 0) {
            return [
                'boss'      => 0,
                'secretary' => 0,
                'intern'    => 0,
                'union'     => 0,
                'canceled'  => 0,
            ];
        }

        $counts = Game::select('winner_role', DB::raw('count(*) as total'))
            ->groupBy('winner_role')
            ->pluck('total', 'winner_role')
            ->toArray();

        // Asegurar que todas las claves existen
        $roles = ['boss', 'secretary', 'intern', 'union', 'canceled'];
        $result = [];
        foreach ($roles as $role) {
            $result[$role] = round(($counts[$role] ?? 0) / $total * 100, 1);
        }
        return $result;
    }

    /**
     * Top 10 cartas más usadas (suma de times_played).
     */
    private function getTopCards(): array
    {
        $cardsConfig = config('cards.cards', []);
        // Mapear id -> display_name
        $cardNames = [];
        foreach ($cardsConfig as $card) {
            $cardNames[$card['id']] = $card['display_name'];
        }

        $top = GameCardUsage::select('card_id', DB::raw('SUM(times_played) as total'))
            ->groupBy('card_id')
            ->orderBy('total', 'desc')
            ->limit(10)
            ->get();

        $result = [];
        foreach ($top as $item) {
            $cardId = (int) $item->card_id;
            $result[] = [
                'id'    => $cardId,
                'name'  => $cardNames[$cardId] ?? 'Carta desconocida',
                'total' => (int) $item->total,
            ];
        }
        return $result;
    }

    /**
     * Crecimiento de usuarios registrados vs invitados (acumulado por día).
     * Si $days > 0, limita a los últimos N días.
     */
    private function getUserGrowth(int $days = 30): array
    {
        $query = User::select(
            DB::raw('DATE(created_at) as date'),
            DB::raw('SUM(CASE WHEN is_guest = 0 THEN 1 ELSE 0 END) as registered_daily'),
            DB::raw('SUM(CASE WHEN is_guest = 1 THEN 1 ELSE 0 END) as guests_daily')
        )
            ->groupBy('date')
            ->orderBy('date', 'asc');

        if ($days > 0) {
            $query->where('created_at', '>=', Carbon::now()->subDays($days));
        }

        $daily = $query->get();

        // Calcular acumulado
        $registeredAcc = 0;
        $guestsAcc = 0;
        $result = [];
        foreach ($daily as $row) {
            $registeredAcc += $row->registered_daily;
            $guestsAcc += $row->guests_daily;
            $result[] = [
                'date'       => $row->date,
                'registered' => $registeredAcc,
                'guests'     => $guestsAcc,
            ];
        }
        return $result;
    }

    /**
     * Estadísticas de métodos de acceso.
     * - google: usuarios con social_account provider = 'google'
     * - discord: usuarios con provider = 'discord'
     * - email: usuarios sin ninguna social_account
     */
    private function getSocialAuthStats(): array
    {
        // Contar usuarios con Google
        $googleCount = SocialAccount::where('provider_name', 'google')
            ->distinct('user_id')
            ->count('user_id');

        // Contar usuarios con Discord
        $discordCount = SocialAccount::where('provider_name', 'discord')
            ->distinct('user_id')
            ->count('user_id');

        // Usuarios registrados (no invitados) que no tienen ninguna social account
        $emailCount = User::where('is_guest', false)
            ->whereDoesntHave('socialAccounts')
            ->count();

        return [
            'google'  => $googleCount,
            'discord' => $discordCount,
            'email'   => $emailCount,
        ];
    }

    /**
     * Sesiones promedio por hora (últimos N días)
     */
    private function getSessionsByHour(int $days = 30): array
    {
        $startDate = Carbon::now()->subDays($days)->startOfDay();

        $sessions = DB::table('sessions')
            ->where('last_activity', '>=', $startDate->timestamp)
            ->select('last_activity')
            ->get();

        // Inicializar contador por hora (0-23)
        $hourlyCounts = array_fill(0, 24, 0);
        $totalDays = 0;

        $processedDays = [];

        foreach ($sessions as $session) {
            $timestamp = $session->last_activity;
            $date = Carbon::createFromTimestamp($timestamp);
            $hour = (int) $date->format('G');
            $dayKey = $date->format('Y-m-d');

            // Registrar que este día tiene actividad
            if (!isset($processedDays[$dayKey])) {
                $processedDays[$dayKey] = true;
                $totalDays++;
            }

            if ($hour >= 0 && $hour <= 23) {
                $hourlyCounts[$hour]++;
            }
        }

        // Calcular promedio por hora (dividir por número de días)
        $result = [];
        for ($hour = 0; $hour < 24; $hour++) {
            $average = $totalDays > 0 ? round($hourlyCounts[$hour] / $totalDays, 1) : 0;
            $result[] = [
                'hour' => $hour,
                'sessions' => $average,
            ];
        }

        return $result;
    }
}
