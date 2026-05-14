<?php

namespace App\Support;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;

class RoomLogger
{
    /**
     * Registra un log de tipo 'info' solo si la sala es de depuración.
     */
    public static function info(string $roomId, string $message, array $context = []): void
    {
        self::writeLog($roomId, 'info', $message, $context);
    }

    /**
     * Registra un log de tipo 'warning' solo si la sala es de depuración.
     */
    public static function warning(string $roomId, string $message, array $context = []): void
    {
        self::writeLog($roomId, 'warning', $message, $context);
    }

    /**
     * Registra un log de tipo 'error' solo si la sala es de depuración.
     */
    public static function error(string $roomId, string $message, array $context = []): void
    {
        self::writeLog($roomId, 'error', $message, $context);
    }

    /**
     * Método central que verifica en Redis si la sala es de pruebas antes de escribir.
     */
    public static function log(string $roomId, string $level, string $message, array $context = []): void
    {
        self::writeLog($roomId, $level, $message, $context);
    }

    /**
     * Lógica interna de verificación y formateo.
     */
    private static function writeLog(string $roomId, string $level, string $message, array $context = []): void
    {
        try {
            $isDebug = Redis::hget("room:{$roomId}:info", 'is_debug');

            if ($isDebug === '1') {
                // Prefijamos el mensaje con la ID de la sala para trazarlo más fácil
                $formattedMessage = "[Sala {$roomId}] {$message}";

                Log::log($level, $formattedMessage, $context);
            }
        } catch (\Exception $e) {
            // Falla silenciosamente si Redis no está disponible o hay un error,
            // para no tumbar la ejecución de la partida por culpa de un log.
            Log::error("RoomLogger falló al intentar verificar la sala {$roomId}: " . $e->getMessage());
        }
    }
}
