<?php
// app/Exceptions/RoomException.php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class RoomException extends Exception
{
    // Constantes exclusivas de la gestión de la sala
    const ROOM_NOT_FOUND = 'ROOM_NOT_FOUND';
    const NOT_IN_ROOM = 'NOT_IN_ROOM';
    const PASSWORD_REQUIRED = 'PASSWORD_REQUIRED';
    const INCORRECT_PASSWORD = 'INCORRECT_PASSWORD';
    const ROOM_FULL = 'ROOM_FULL';
    const NOT_LEADER = 'NOT_LEADER';
    const CANNOT_KICK_SELF = 'CANNOT_KICK_SELF';
    const ALREADY_IN_ROOM = 'ALREADY_IN_ROOM';
    const PLAYER_NOT_FOUND = 'PLAYER_NOT_FOUND';
    const NOT_ENOUGH_PLAYERS = 'NOT_ENOUGH_PLAYERS';
    const ALREADY_IN_ANOTHER_ROOM = 'ALREADY_IN_ANOTHER_ROOM';

    protected string $errorType;

    public function __construct(string $errorType, string $message, int $code = 400)
    {
        parent::__construct($message, $code);
        $this->errorType = $errorType;
    }

    public function getErrorType(): string
    {
        return $this->errorType;
    }

    /**
     * Renderiza la excepción en una respuesta HTTP y escribe el log limpio.
     */
    public function render(Request $request): JsonResponse
    {
        $roomId = $request->route('id') ?? $request->route('room') ?? 'Unknown';
        $username = $request->user() ? $request->user()->username : 'Unknown';

        Log::warning("RoomException [{$this->errorType}]: {$this->message} | RoomID: {$roomId} | User: {$username}");

        return response()->json([
            'error' => $this->getMessage(),
            'type' => $this->getErrorType()
        ], $this->getCode());
    }
}
