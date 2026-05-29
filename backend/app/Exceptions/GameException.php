<?php

namespace App\Exceptions;

use App\Support\RoomLogger;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class GameException extends Exception
{
    // Constantes exclusivas del estado del JUEGO y la PARTIDA
    const GAME_ALREADY_STARTED = 'GAME_ALREADY_STARTED';
    const GAME_NOT_STARTED = 'GAME_NOT_STARTED';
    const NOT_YOUR_TURN = 'NOT_YOUR_TURN';
    const INVALID_TARGET = 'INVALID_TARGET';
    const CARD_NOT_IN_HAND = 'CARD_NOT_IN_HAND';
    const INVALID_ACTION = 'INVALID_ACTION';
    const CANNOT_SKIP_DURING_ENDING = 'CANNOT_SKIP_DURING_ENDING';
    const GAME_OVER = 'GAME_OVER';

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
        $roomId = $request->route('id') ?? $request->route('room') ?? 'Desconocida';
        $username = $request->user() ? $request->user()->username : 'Desconocido';

        RoomLogger::warning($roomId, "GameException [{$this->errorType}]: {$this->message} | Usuario: {$username}");

        return response()->json([
            'error' => $this->getMessage(),
            'type' => $this->getErrorType()
        ], $this->getCode());
    }
}
