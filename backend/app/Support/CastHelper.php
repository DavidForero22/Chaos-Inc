<?php
// app/Support/CastHelper.php

namespace App\Support;

class CastHelper
{
    public static function toBool(mixed $value): bool
    {
        return filter_var($value, FILTER_VALIDATE_BOOLEAN);
    }
}