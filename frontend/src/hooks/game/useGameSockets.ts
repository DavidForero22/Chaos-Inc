// src/hooks/game/useGameSockets.ts

import { useEffect } from "react";
import echo from "../../echo";
import { logWithTime } from "../../utils/logger";

interface UseGameSocketsProps {
	roomId: string | undefined;
	myPlayerName: string;
	refreshGameData: () => void;
	onActingBossAssigned: () => void;
	onActingBossGrace: () => void;
	onActingBossGraceCancelled: () => void;
}

export function useGameSockets({
	roomId,
	myPlayerName,
	refreshGameData,
	onActingBossAssigned,
	onActingBossGrace,
	onActingBossGraceCancelled,
}: UseGameSocketsProps) {
	useEffect(() => {
		if (!roomId) return;

		// Canal público de sala — cambios de estado generales
		const roomChannel = echo.channel(`room.${roomId}`);
		roomChannel.listen(".RoomStateUpdated", () => {
			logWithTime("El estado del tablero ha cambiado, recargando...");
			refreshGameData();
		});

		return () => {
			roomChannel.stopListening(".RoomStateUpdated");
			echo.leaveChannel(`room.${roomId}`);
		};
	}, [roomId, refreshGameData]);

	useEffect(() => {
		if (!myPlayerName) return;

		// Canal privado del jugador — solo él recibe este evento.
		// Ningún otro jugador puede ver que este canal recibió algo.
		const privateChannel = echo.private(`player.${myPlayerName}`);
		privateChannel.listen(".ActingBossAssigned", () => {
			logWithTime(
				"Evento privado recibido: este jugador es el nuevo jefe heredado.",
			);
			onActingBossAssigned();
		});

		privateChannel.listen(".ActingBossGracePeriodStarted", () => {
			logWithTime(
				"Evento privado: el secretario se ha desconectado, posible herencia.",
			);
			onActingBossGrace();
		});

		privateChannel.listen(".ActingBossGracePeriodCancelled", () => {
			logWithTime("Evento privado: grace period del jefe heredado cancelada.");
			onActingBossGraceCancelled();
		});

		return () => {
			privateChannel.stopListening(".ActingBossAssigned");
			privateChannel.stopListening(".ActingBossGracePeriodStarted");
			privateChannel.stopListening(".ActingBossGracePeriodCancelled");
			echo.leaveChannel(`private-player.${myPlayerName}`);
		};
	}, [
		myPlayerName,
		onActingBossAssigned,
		onActingBossGrace,
		onActingBossGraceCancelled,
	]);
}
