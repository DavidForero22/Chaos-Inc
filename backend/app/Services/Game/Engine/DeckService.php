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
            $cardId = $card['id'] ?? null;
            $count = $card['count'] ?? 0;

            if ($cardId === null || $count <= 0) continue;

            for ($i = 0; $i < $count; $i++) {
                $deck[] = [
                    'id'                   => uniqid((string) $cardId . '_', true), // ID único de la instancia en la mano
                    'card_id'              => $cardId, // El ID base (1, 2, 3...)
                    'type'                 => $card['type'],
                    'target'               => $card['target'],
                    'base_name'            => $card['base_name'] ?? 'Carta',
                    'name'                 => $card['display_name'] ?? ($card['base_name'] ?? 'Carta'),
                    'description'          => $card['description'] ?? '',
                    'lore'                 => $card['lore'] ?? '',
                    'icons'                => $card['icons'] ?? [],
                    'image'                => $card['image'] ?? null,
                ];
            }
        }

        shuffle($deck);
        return $deck;
    }

    /**
     * Reparte cartas a un jugador y trackea los nuevos descubrimientos.
     */
    public function drawCardsForPlayer(string $roomId, string $playerId, int $amount): void
    {
        if ($amount <= 0) return;

        $deckKey = "room:{$roomId}:deck";
        $deck = json_decode(Redis::get($deckKey) ?: '[]', true);

        $drawn = [];
        for ($i = 0; $i < $amount; $i++) {
            // Si el mazo se agota, reponerlo al momento
            if (empty($deck)) {
                $deck = $this->buildDeck();
                if (empty($deck)) break;
            }
            $drawn[] = array_shift($deck);
        }

        Redis::set($deckKey, json_encode($deck));

        if (empty($drawn)) return;

        // --- Trackear nuevas cartas ---
        $knownKey = "room:{$roomId}:player:{$playerId}:known_cards";
        $newKey   = "room:{$roomId}:player:{$playerId}:new_cards";

        foreach ($drawn as $card) {
            $cardBaseId = (string) $card['card_id']; // ID numérico
            // Si ya está en known_cards, no hacer nada
            if (!Redis::sismember($knownKey, $cardBaseId)) {
                // Añadir a new_cards (set, evita duplicados)
                Redis::sadd($newKey, $cardBaseId);
            }
        }

        // --- Guardar mano ---
        $handKey = "room:{$roomId}:player:{$playerId}:hand";
        $currentCards = json_decode(Redis::get($handKey) ?: '[]', true);
        if (!is_array($currentCards)) $currentCards = [];

        Redis::set($handKey, json_encode(array_merge($currentCards, $drawn)));
    }

    /**
     * Inicializa el mazo y reparte las cartas iniciales (3 por jugador),
     * trackeando nuevos descubrimientos.
     */
    public function initialDeal(string $roomId, string $playerId, array $initialCards): void
    {
        $handKey = "room:{$roomId}:player:{$playerId}:hand";
        Redis::set($handKey, json_encode($initialCards));

        $knownKey = "room:{$roomId}:player:{$playerId}:known_cards";
        $newKey   = "room:{$roomId}:player:{$playerId}:new_cards";

        foreach ($initialCards as $card) {
            $cardBaseId = (string) $card['card_id'];
            if (!Redis::sismember($knownKey, $cardBaseId)) {
                Redis::sadd($newKey, $cardBaseId);
            }
        }
    }
}
