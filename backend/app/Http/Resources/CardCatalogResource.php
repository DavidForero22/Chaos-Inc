<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CardCatalogResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        $card = $this->resource;

        return [
            'id'           => $card['id'] ?? 0,
            'type'         => $card['type'] ?? 'default',
            'target'       => $card['target'] ?? 'none',
            'base_name'    => $card['base_name'] ?? 'Desconocida',
            'display_name' => $card['display_name'] ?? 'Desconocida',
            'description'  => $card['description'] ?? '',
            'lore'         => $card['lore'] ?? '',
            'icons'        => $card['icons'] ?? [],
            'image_path'   => $card['image'] ?? null,
        ];
    }
}
