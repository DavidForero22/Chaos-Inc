<?php

namespace App\Support;

class GameMessages
{
    // Acciones de cartas
    public static function attacked(string $attacker, string $target): string
    {
        return "{$attacker} ha atacado a {$target}.";
    }

    public static function healed(string $player): string
    {
        return "{$player} se ha curado.";
    }

    public static function stolen(string $player, string $target): string
    {
        return "{$player} le ha robado una carta a {$target}.";
    }

    public static function shielded(string $player): string
    {
        return "{$player} se ha puesto un escudo.";
    }

    public static function dodged(string $player): string
    {
        return "{$player} ha esquivado el ataque.";
    }

    public static function tookDamage(string $player): string
    {
        return "{$player} no ha esquivado el ataque.";
    }

    public static function eliminated(string $player): string
    {
        return "{$player} ha sido eliminado.";
    }

    public static function blocked(string $player, string $target): string
    {
        return "{$player} ha bloqueado el turno de {$target}.";
    }

    public static function luckySuccess(string $player): string
    {
        return "{$player} superó la prueba de suerte y puede jugar su turno.";
    }

    public static function luckyFail(string $player): string
    {
        return "{$player} falló la prueba de suerte y pierde su turno.";
    }

    // Conexiones
    public static function disconnected(string $player): string
    {
        return "{$player} se ha desconectado.";
    }

    public static function reconnected(string $player): string
    {
        return "{$player} se ha reconectado.";
    }
}
