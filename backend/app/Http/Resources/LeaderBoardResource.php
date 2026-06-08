<?php

namespace App\Http\Resources;

use App\Services\Game\Engine\ExperienceService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LeaderBoardResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'       => $this->id,
            'avatar'   => $this->avatar,
            'username' => $this->username,
            'total_xp' => $this->total_xp,
            'level'    => ExperienceService::levelFromXp($this->total_xp),
        ];
    }
}
