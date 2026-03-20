// src/hooks/game/useGameSockets.ts

import { useEffect, useRef } from "react";
import echo from "../../echo";
import { logWithTime } from "../../utils/logger";
import api from "../../api/axios";

interface UseGameSocketsProps {
	roomId: string | undefined;
	refreshGameData: () => void;
}

export function useGameSockets({
	roomId,
	refreshGameData,
}: UseGameSocketsProps) {
	const refreshRef = useRef(refreshGameData);
	useEffect(() => {
		refreshRef.current = refreshGameData;
	}, [refreshGameData]);

	useEffect(() => {
		if (!roomId) return;

		const roomChannel = echo.join(`room.${roomId}`);
		const connectedAt = Date.now();

		roomChannel
			.here((users: any[]) => {
				logWithTime(
					`useGameSockets.ts - Hay ${users.length} usuarios en la sala.`,
				);
			})
			.joining((user: any) => {
				logWithTime(
					`useGameSockets.ts - ${user.username} se ha conectado al socket.`,
				);
			})
			.leaving((user: any) => {
				const secondsSinceConnect = (Date.now() - connectedAt) / 1000;
				if (secondsSinceConnect < 2) return;

				logWithTime(
					`useGameSockets.ts - ${user.username} cerró la ventana o perdió conexión.`,
				);

				api
					.post(`/rooms/${roomId}/report-disconnect`, {
						disconnected_player: user.username,
					})
					.then(() =>
						logWithTime(`report-disconnect enviado para ${user.username}`),
					)
					.catch(() => {});

				refreshRef.current();
			})
			.listen(".RoomStateUpdated", () => {
				logWithTime(
					"useGameSockets.ts - El estado de la sala ha cambiado, recargando...",
				);
				refreshRef.current();
			});

		return () => {
			roomChannel.stopListening(".RoomStateUpdated");
			echo.leave(`room.${roomId}`);
		};
	}, [roomId]);
}
