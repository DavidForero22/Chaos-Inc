<?php

namespace Database\Seeders;

use App\Models\Card;
use Illuminate\Database\Seeder;

class CardSeeder extends Seeder
{
    public function run(): void
    {
        $cards = config('game.cards.cards', []);

        foreach ($cards as $cardData) {
            Card::updateOrCreate(
                ['id' => $cardData['id']],
                [
                    'base_name' => $cardData['base_name'] ?? 'Carta Sin Nombre',
                    'type'      => $cardData['type'] ?? 'default',
                    'category'  => $cardData['category'] ?? 'normal',
                ]
            );
        }
    }
}
