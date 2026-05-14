// src/utils/logger.ts
import { useRoomStore } from "../store/useRoomStore";

type LogType = "info" | "warn" | "error";

/**
 * Muestra un mensaje en consola con un timestamp detallado [HH:mm:ss.SSS]
 * Solo se mostrará si la sala actual está marcada como debug.
 */
export const logWithTime = (
	message: string,
	data: any = null,
	type: LogType = "info",
) => {
	const room = useRoomStore.getState().room;

	//  Comprobar si es una sala de debug (manejamos posibles formatos de string/booleano)
	const isDebug = String(room?.is_debug) === "1";

	// Si no hay sala o no es de debug, abortar
	if (!isDebug) {
		return;
	}

	// Fecha con formato
	const now = new Date();
	const time = now.toTimeString().split(" ")[0];
	const ms = String(now.getMilliseconds()).padStart(3, "0");

	const timestamp = `[${time}.${ms}]`;
	const fullMessage = `${timestamp} - ${message}`;

	switch (type) {
		case "warn":
			data ? console.warn(fullMessage, data) : console.warn(fullMessage);
			break;
		case "error":
			data ? console.error(fullMessage, data) : console.error(fullMessage);
			break;
		case "info":
			data ? console.info(fullMessage, data) : console.info(fullMessage);
			break;
		default:
			console.error("Estás usando un caso de log en logger.ts no válido.");
	}
};
