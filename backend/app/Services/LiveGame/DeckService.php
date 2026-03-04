<?php

namespace App\Services\LiveGame;

use Illuminate\Support\Facades\Redis;

class DeckService
{
    public function buildDeck(): array
    {
        $definitions = config('cards.cards', []);
        $deck = [];

        foreach ($definitions as $card) {
            $id = $card['id'] ?? null;
            $count = $card['count'] ?? 0;

            if ($id === null || $count <= 0) continue;

            for ($i = 0; $i < $count; $i++) {
                $deck[] = [
                    'id'          => uniqid((string) $id . '_', true),
                    'type'        => $id,
                    'name'        => $card['name'] ?? 'Carta',
                    'description' => $card['description'] ?? '',
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

        if (empty($deck)) return;

        $drawn = [];
        for ($i = 0; $i < $amount; $i++) {
            if (empty($deck)) break;
            $drawn[] = array_shift($deck);
        }

        Redis::set($deckKey, json_encode($deck));

        if (empty($drawn)) return;

        $playerKey = "room:{$roomId}:player:{$playerName}";
        $currentCards = json_decode(Redis::hget($playerKey, 'cards') ?: '[]', true);

        if (!is_array($currentCards)) $currentCards = [];

        Redis::hset($playerKey, 'cards', json_encode(array_merge($currentCards, $drawn)));
    }
}
