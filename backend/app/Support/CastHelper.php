<?php
// app/Support/CastHelper.php

namespace App\Support;

class CastHelper
{
    /**
     * Compara un valor para devolverlo como booleano.
     */
    public static function toBool(mixed $value): bool
    {
        return filter_var($value, FILTER_VALIDATE_BOOLEAN);
    }
}