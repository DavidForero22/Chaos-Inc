// src/hooks/game/useGameSockets.ts

import { useEffect } from "react";
import echo from "../../echo";
import { logWithTime } from "../../utils/logger";
import api from "../../api/axios";
import { useGameStore } from "../../store/useGameStore.ts";

const DISCONNECT_GRACE_MS = 4000; // Margen para F5 / reconexiones rápidas

interface UseGameSocketsProps {
	roomId: string | undefined;
}

export function useGameSockets({ roomId }: UseGameSocketsProps) {
	useEffect(() => {
		if (!roomId) return;

		const roomChannel = echo.join(`room.${roomId}`);
		const connectedAt = Date.now();
		let syncTimeout: ReturnType<typeof setTimeout> | null = null;

		// Map para cancelar reportes si el jugador vuelve antes de que expire
		const pendingDisconnects = new Map<string, ReturnType<typeof setTimeout>>();

		roomChannel
			.here((users: any[]) => {
				logWithTime(
					`useGameSockets.ts - Hay ${users.length} usuarios en la sala.`,
				);
			})
			.joining((user: any) => {
				// Si había un reporte pendiente para este usuario, cancelarlo
				if (pendingDisconnects.has(user.username)) {
					clearTimeout(pendingDisconnects.get(user.username)!);
					pendingDisconnects.delete(user.username);

					logWithTime(
						`useGameSockets.ts - ${user.username} volvió antes de que se enviara el reporte. Cancelado.`,
					);

					// Notificar al estado que el jugador regresó
					const state = useGameStore.getState();
					state.addLog(`${user.username} ha vuelto a la partida.`);
					if (!state.isConnecting && !state.gameOver) {
						state.syncGame();
					}
					return;
				}

				logWithTime(
					`useGameSockets.ts - ${user.username} se ha conectado al socket.`,
				);
			})
			.leaving((user: any) => {
				const state = useGameStore.getState();

				if (state.gameOver) {
					logWithTime(
						`useGameSockets.ts - Ignorando desconexión de ${user.username} (Game Over).`,
					);
					return;
				}

				const secondsSinceConnect = (Date.now() - connectedAt) / 1000;
				if (secondsSinceConnect < 2) return;

				// Si ya hay un reporte pendiente para este usuario, no acumular otro
				if (pendingDisconnects.has(user.username)) return;

				logWithTime(
					`useGameSockets.ts - ${user.username} abandonó el socket. Esperando ${DISCONNECT_GRACE_MS / 1000}s antes de reportar...`,
				);

				const timeout = setTimeout(() => {
					pendingDisconnects.delete(user.username);

					// Re-verificar estado antes de enviar (podría haber terminado la partida durante la espera)
					const currentState = useGameStore.getState();
					if (currentState.gameOver) return;

					logWithTime(
						`useGameSockets.ts - ${user.username} sigue fuera tras ${DISCONNECT_GRACE_MS / 1000}s. Enviando report-disconnect.`,
					);

					api
						.post(`/rooms/${roomId}/report-disconnect`, {
							disconnected_player: user.username,
						})
						.then(() => {
							logWithTime(
								`useGameSockets.ts - /report-disconnect enviado para ${user.username}`,
							);

							const latestState = useGameStore.getState();
							if (!latestState.isConnecting && !latestState.gameOver) {
								latestState.syncGame();
							}
						})
						.catch(() => {});
				}, DISCONNECT_GRACE_MS);

				pendingDisconnects.set(user.username, timeout);
			})
			.listen(".RoomStateUpdated", (data: { log_message?: string }) => {
				const state = useGameStore.getState();
				if (state.gameOver) return;

				if (data.log_message) {
					state.addLog(data.log_message);
				}

				if (!state.isConnecting) {
					if (syncTimeout) clearTimeout(syncTimeout);
					syncTimeout = setTimeout(() => {
						useGameStore.getState().syncGame();
						syncTimeout = null;
					}, 100);
				}
			});

		return () => {
			// Limpiar todos los timeouts pendientes al desmontar
			pendingDisconnects.forEach((t) => clearTimeout(t));
			pendingDisconnects.clear();
			roomChannel.stopListening(".RoomStateUpdated");
			echo.leave(`room.${roomId}`);
		};
	}, [roomId]);
}
