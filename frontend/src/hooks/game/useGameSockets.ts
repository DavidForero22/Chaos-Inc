// src/hooks/game/useGameSockets.ts

import { useEffect } from "react";
import echo from "../../echo";
import { logWithTime } from "../../utils/logger";
import api from "../../api/axios";
import { useGameStore } from "../../store/useGameStore.ts";

interface UseGameSocketsProps {
	roomId: string | undefined;
}

export function useGameSockets({ roomId }: UseGameSocketsProps) {
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
				const state = useGameStore.getState();

				// Si la partida terminó, ignorar desconexiones
				if (state.gameOver) {
					logWithTime(
						`useGameSockets.ts - Ignorando desconexión de ${user.username} (Game Over).`,
					);
					return;
				}

				const secondsSinceConnect = (Date.now() - connectedAt) / 1000;
				if (secondsSinceConnect < 2) return;

				logWithTime(
					`useGameSockets.ts - ${user.username} cerró la ventana o perdió conexión.`,
				);

				api
					.post(`/rooms/${roomId}/report-disconnect`, {
						disconnected_player: user.username,
					})
					.then(() => {
						logWithTime(`report-disconnect enviado para ${user.username}`);

						// Volver a obtener el estado más reciente por si acaso
						const currentState = useGameStore.getState();
						if (!currentState.isConnecting && !currentState.gameOver) {
							currentState.syncGame();
						}
					})
					.catch(() => {});
			})
			.listen(".RoomStateUpdated", (data: { log_message?: string }) => {
				const state = useGameStore.getState();

				// Si la partida terminó, ignorar actualizaciones
				if (state.gameOver) {
					return;
				}

				logWithTime("useGameSockets.ts - Estado actualizado.");

				if (data.log_message) {
					state.addLog(data.log_message);
				}

				if (!state.isConnecting) {
					state.syncGame();
				}
			});

		return () => {
			roomChannel.stopListening(".RoomStateUpdated");
			echo.leave(`room.${roomId}`);
		};
	}, [roomId]);
}
