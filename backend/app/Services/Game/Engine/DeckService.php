<?php
// app/Services/Game/Engine/DeckService.php

namespace App\Services\Game\Engine;

use Illuminate\Support\Facades\Redis;

class DeckService
{
    public function buildDeck(): array
    {
        $definitions = config('cards.cards', []);
        $deck = [];

        foreach ($definitions as $card) {
            $cardId = $card['id'] ?? null; // ID numérico base
            $count = $card['count'] ?? 0;

            if ($cardId === null || $count <= 0) continue;

            $hasVariants = !empty($card['variants']);
            $variants = $hasVariants ? $card['variants'] : [];

            for ($i = 0; $i < $count; $i++) {
                // Elegir una variante aleatoria si existen, o array vacío si no hay
                $variant = $hasVariants ? $variants[array_rand($variants)] : [];

                $deck[] = [
                    'id'                   => uniqid((string) $cardId . '_', true), // ID único de la instancia en la mano
                    'card_id'              => $cardId, // El ID base (1, 2, 3...)
                    'type'                 => $card['type'] ?? 'default', // Para el color del borde en React
                    'base_name'            => $card['base_name'] ?? 'Carta',
                    'name'                 => $variant['name'] ?? ($card['base_name'] ?? 'Carta'),
                    'description'          => $card['description'] ?? '',
                    'lore'                 => $variant['lore'] ?? '',
                    'image'                => $variant['image'] ?? null,
                    'icons'                => $card['icons'] ?? [],
                ];
            }
        }

        shuffle($deck);
        return $deck;
    }

    public function drawCardsForPlayer(string $roomId, string $playerName, int $amount): void
    {
        if ($amount <= 0) return;

        $deckKey = "room:{$roomId}:deck";
        $deck = json_decode(Redis::get($deckKey) ?: '[]', true);

        $drawn = [];
        for ($i = 0; $i < $amount; $i++) {
            // Si el mazo se agota, reponerlo al momento
            if (empty($deck)) {
                $deck = $this->buildDeck();
                if (empty($deck)) break; // cards.php vacío, salida de seguridad
            }
            $drawn[] = array_shift($deck);
        }

        Redis::set($deckKey, json_encode($deck));

        if (empty($drawn)) return;

        $handKey = "room:{$roomId}:player:{$playerName}:hand";

        $currentCards = json_decode(Redis::get($handKey) ?: '[]', true);
        if (!is_array($currentCards)) $currentCards = [];

        Redis::set($handKey, json_encode(array_merge($currentCards, $drawn)));
    }
}
