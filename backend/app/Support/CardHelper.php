<?php
// app/Helpers/CardHelper.php 
namespace App\Support;

use App\Exceptions\GameException;
use Illuminate\Support\Facades\Redis;

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

    public static function checkSacrificeCardExists(string $roomId, int $playerId, ?string $sacrificeCardId): void
    {
        if (!$sacrificeCardId) {
            throw new GameException(GameException::INVALID_ACTION, "Debes sacrificar una carta para usar esta carta caótica.", 422);
        }
        $handKey = "room:{$roomId}:player:{$playerId}:hand";
        $cards = collect(json_decode(Redis::get($handKey) ?: '[]', true));
        if (!$cards->contains('id', $sacrificeCardId)) {
            throw new GameException(GameException::CARD_NOT_IN_HAND, "La carta a sacrificar no está en tu mano.", 422);
        }
    }
}
