<?php
// app/Helpers/CardHelper.php 
namespace App\Support;

class CardHelper
{
    public static function formatCard(array $card, bool $isDiscovered, int $timesPlayed = 0): array
    {
        if (!$isDiscovered) {
            return [
                'id'            => $card['id'],
                'display_name'  => '???',
                'description'   => null,
                'lore'          => null,
                'image_path'    => null,
                'type'          => null,
                'is_discovered' => false,
                'times_played'  => 0,
            ];
        }

        return [
            'id'           => $card['id'],
            'type'         => $card['type'] ?? 'default',
            'target'       => $card['target'] ?? 'none',
            'base_name'    => $card['base_name'] ?? 'Desconocida',
            'display_name' => $card['display_name'] ?? 'Desconocida',
            'description'  => $card['description'] ?? '',
            'lore'         => $card['lore'] ?? '',
            'icons'        => $card['icons'] ?? [],
            'image_path'   => $card['image'] ?? null,
            'is_discovered' => true,
            'times_played'  => $timesPlayed,
        ];
    }
}
