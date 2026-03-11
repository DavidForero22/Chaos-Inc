<?php
// app/Exceptions/IdentityException.php

namespace App\Exceptions;

use Exception;

class IdentityException extends Exception
{
    const USER_NOT_FOUND = 'USER_NOT_FOUND';
    const SESSION_EXPIRED = 'SESSION_EXPIRED';

    protected string $errorType;

    public function __construct(string $errorType, string $message, int $code = 401)
    {
        parent::__construct($message, $code);
        $this->errorType = $errorType;
    }

    public function getErrorType(): string
    {
        return $this->errorType;
    }
}
