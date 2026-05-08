// src/hooks/game/useGameSockets.ts

import { useEffect } from "react";
import echo from "../../echo";
import { logWithTime } from "../../utils/logger";
import { useGameStore } from "../../store/useGameStore.ts";
import { useNotificationStore } from "../../store/useNotificationStore.ts";
import { useGameEventParser } from "./useGameEventParser.ts";
import { ACHIEVEMENTS } from "../../data/achievements.ts";
import { useAchievementNotificationStore } from "../../store/useAchievementNotificationStore.ts";

import api from "../../api/axios.ts";

interface UseGameSocketsProps {
	roomId: string | undefined;
}

type AchievementNotificationPayload = {
	playerId: string | number;
	achievementId: string;
};

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

				// 0. Si el juego acabó, ignorar actualizaciones
				if (state.gameOver) return;

				// 1. Lógica de Logros (se mantiene igual)
				if (
					Array.isArray(data.achievement_notifications) &&
					data.achievement_notifications.length > 0
				) {
					// ... tu código de logros ...
				}

				// 2. Notificaciones de uso de cartas
				if (data.card_action) {
					parseAndNotify(
						data.card_action.card_id,
						data.card_action.source,
						data.card_action.target,
					);
				} else if (data.log_message) {
					useNotificationStore.getState().addLog(data.log_message);
				}

				// 3. LA GRAN SINCRONIZACIÓN (Siempre ocurre)
				if (!state.isConnecting) {
					if (syncTimeout) clearTimeout(syncTimeout);

					syncTimeout = setTimeout(() => {
						useGameStore
							.getState()
							.syncGame()
							.then(() => {
								// 4. UNA VEZ SINCRONIZADO, VERIFICAMOS LA SUERTE
								// Lo hacemos aquí dentro para asegurar que el 'current_turn' ya es el nuevo jugador
								if (data.player_drew_extra_card) {
									console.log(
										"Reconoce que ha entrado en el if (data.player_drew_extra_card)",
									);
									const latestState = useGameStore.getState();
									const currentTurnPlayer =
										latestState.gameData?.game?.current_turn;
									const myName = latestState.gameData?.me?.name;

									if (currentTurnPlayer) {
										const isMe = myName === currentTurnPlayer;
										const message = isMe
											? "¡Has robado una carta extra!"
											: `${currentTurnPlayer} ha robado una carta extra`;

										const notifStore = useNotificationStore.getState();
										notifStore.addNotification({
											type: "luck",
											message,
											iconKey: "luck",
										});
									}
								}
							});
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
