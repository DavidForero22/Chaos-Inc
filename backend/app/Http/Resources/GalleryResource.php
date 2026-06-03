<?php
// app/Http/Resources/GalleryResource.php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GalleryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'cards'    => $this['cards'],
            'roles'    => $this['roles'],
            'endings'  => $this['endings'],
            'extras'  => $this['extras'],
        ];
    }
}
