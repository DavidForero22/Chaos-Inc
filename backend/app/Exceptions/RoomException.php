<?php

namespace App\Exceptions;

use Exception;

class RoomException extends Exception
{
    // Constantes exclusivas de la gestión de la SALA
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
}
