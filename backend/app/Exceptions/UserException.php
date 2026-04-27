<?php
// backend\app\Exceptions\UserException.php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class UserException extends Exception
{
    public const EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS';
    public const USERNAME_ALREADY_EXISTS = 'USERNAME_ALREADY_EXISTS';
    public const INVALID_DATA = 'INVALID_DATA';
    public const GENERAL_ERROR = 'GENERAL_ERROR';

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

    public function render(Request $request): JsonResponse
    {
        $username = $request->user()?->username ?? 'Desconocido';

        Log::warning(
            "UserException [{$this->errorType}]: {$this->message} | Ruta: {$request->path()} | Usuario: {$username}"
        );

        return response()->json([
            'error' => $this->getMessage(),
            'type' => $this->getErrorType(),
        ], $this->getCode());
    }
}
