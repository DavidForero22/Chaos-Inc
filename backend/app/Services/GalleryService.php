<?php
// app/Services/Gallery/GalleryService.php

namespace App\Services;

use App\Models\User;
use App\Models\UserDiscoveredCard;
use App\Models\GameUser;
use App\Models\Game;
use App\Support\CardHelper;
use Illuminate\Support\Facades\DB;

class GalleryService
{
    public function getUserGalleryData(User $user): array
    {
        // 1. Cartas
        $cardsCatalog = config('game.cards.cards', []);
        $discoveredCardIds = UserDiscoveredCard::where('user_id', $user->id)
            ->pluck('card_id')
            ->values();

        $timesPlayed = DB::table('game_card_usage')
            ->where('user_id', $user->id)
            ->select('card_id', DB::raw('SUM(times_played) as total'))
            ->groupBy('card_id')
            ->pluck('total', 'card_id');

        $cards = [];
        foreach ($cardsCatalog as $card) {
            $cardId = $card['id'];
            $isDiscovered = $discoveredCardIds->contains($cardId);

            $cards[] = CardHelper::formatCard(
                $card,
                $isDiscovered,
                $timesPlayed->get($cardId, 0)
            );
        }

        // 2. Roles desbloqueados
        $rolesUnlocked = GameUser::where('user_id', $user->id)
            ->where('is_guest', false)
            ->distinct()
            ->pluck('role')
            ->values();

        // 3. Finales desbloqueados
        $gameIds = GameUser::where('user_id', $user->id)
            ->where('is_guest', false)
            ->pluck('game_id');

        $endingsUnlocked = Game::whereIn('id', $gameIds)
            ->distinct()
            ->pluck('winner_role')
            ->map(fn($role) => $role ?? 'canceled')
            ->values();

        // 4. Extras desbloqueables por logros
        $totalAchievements = DB::table('achievement_user')
            ->where('user_id', $user->id)
            ->count();

        $extrasConfig = config('gallery.extras', []);
        $extras = [];

        foreach ($extrasConfig as $extra) {
            $isUnlocked = $totalAchievements >= $extra['achievements_required'];

            $formatted = [
                'id' => $extra['id'],
                'name' => $extra['name'],
                'achievements_required' => $extra['achievements_required'],
                'is_unlocked' => $isUnlocked,
            ];

            if ($isUnlocked) {
                $formatted['description'] = $extra['description'] ?? '';
                // Añadir barra inicial a las rutas de imagen
                $formatted['image'] = isset($extra['image']) ? '/' . $extra['image'] : null;
                $formatted['images'] = isset($extra['images'])
                    ? array_map(fn($img) => '/' . $img, $extra['images'])
                    : null;
            }

            $extras[] = $formatted;
        }


        return [
            'cards'    => $cards,
            'roles'    => $rolesUnlocked,
            'endings'  => $endingsUnlocked,
            'extras'   => $extras,
        ];
    }
}
