<?php

namespace App\Exceptions;

use Exception;

class GameException extends Exception
{
    // Constantes exclusivas del estado del JUEGO y la PARTIDA
    const GAME_ALREADY_STARTED = 'GAME_ALREADY_STARTED';
    const GAME_NOT_STARTED = 'GAME_NOT_STARTED';

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
