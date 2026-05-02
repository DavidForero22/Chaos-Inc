// src/hooks/game/useGameSockets.ts

import { useEffect } from "react";
import echo from "../../echo";
import { logWithTime } from "../../utils/logger";
import { useGameStore } from "../../store/useGameStore.ts";
import { useNotificationStore } from "../../store/useNotificationStore.ts";
import { useGameEventParser } from "./useGameEventParser.ts";
import api from "../../api/axios.ts";

interface UseGameSocketsProps {
	roomId: string | undefined;
}

export function useGameSockets({ roomId }: UseGameSocketsProps) {
	const { parseAndNotify } = useGameEventParser();

	useEffect(() => {
		if (!roomId) return;

		const roomChannel = echo.join(`room.${roomId}`);
		let syncTimeout: ReturnType<typeof setTimeout> | null = null;

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
				// Sincronizar si vuelve alguien (reconexión rápida)
				const state = useGameStore.getState();
				if (!state.isConnecting && !state.gameOver) {
					state.syncGame();
				}
			})
			.leaving((user: any) => {
				const state = useGameStore.getState();
				if (state.gameOver) return;

				logWithTime(
					`useGameSockets.ts - Socket cerrado para ${user.username} (ID: ${user.id}). Avisando al servidor INMEDIATAMENTE.`,
				);

				api
					.post(`/rooms/${roomId}/report-disconnect`, {
						disconnected_player_id: user.id,
						disconnected_player_name: user.username,
					})
					.catch(() => {});
			})
			.listen(".RoomStateUpdated", (data: any) => {
				const state = useGameStore.getState();
				if (state.gameOver) return;

				// 1. ¿Es una acción de carta estructurada?
				if (data.card_action) {
					parseAndNotify(
						data.card_action.card_id,
						data.card_action.source,
						data.card_action.target,
					);
				}
				// 2. ¿Es un mensaje de sistema antiguo/genérico?
				else if (data.log_message) {
					useNotificationStore.getState().addLog(data.log_message);
				}

				// 3. Sincronizar el estado del tablero (cartas, vida, etc.)
				if (!state.isConnecting) {
					if (syncTimeout) clearTimeout(syncTimeout);
					syncTimeout = setTimeout(() => {
						useGameStore.getState().syncGame();
						syncTimeout = null;
					}, 100);
				}
			});

		return () => {
			roomChannel.stopListening(".RoomStateUpdated");
			echo.leave(`room.${roomId}`);
		};
	}, [roomId]);
}
