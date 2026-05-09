// src/hooks/game/useGameSockets.ts

import { useEffect } from "react";
import echo from "../../echo";
import { logWithTime } from "../../utils/logger";
import { useGameStore } from "../../store/useGameStore.ts";
import { useNotificationStore } from "../../store/useNotificationStore.ts";
import { useGameEventParser } from "./useGameEventParser.ts";

import api from "../../api/axios.ts";
import { ACHIEVEMENTS } from "../../data/achievements.ts";
import { useAchievementNotificationStore } from "../../store/useAchievementNotificationStore.ts";

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

				// Si el juego acabó, ignorar actualizaciones
				if (state.gameOver) return;

				// Lógica de Logros
				if (
					Array.isArray(data.achievement_notifications) &&
					data.achievement_notifications.length > 0
				) {
					const me = state.gameData?.me as any;
					const myPlayerId = me?.playerId ?? me?.user_id ?? me?.id ?? null;
					const opponents = state.gameData?.game?.opponents ?? [];

					data.achievement_notifications.forEach(
						(notif: AchievementNotificationPayload) => {
							const achievementOwnerId = notif?.playerId;
							const achievementId = notif?.achievementId;

							if (!achievementId || achievementOwnerId == null) return;

							const isMe = String(myPlayerId) === String(achievementOwnerId);

							if (isMe) {
								useAchievementNotificationStore
									.getState()
									.addAchievementNotification(achievementId);
								useGameStore.getState().addMatchAchievement(achievementId);
							} else {
								const achievement = ACHIEVEMENTS.find(
									(a) => a.id === achievementId,
								);
								const achievementTitle = achievement?.title ?? achievementId;

								const opponent = opponents.find(
									(o: any) => String(o.id) === String(achievementOwnerId),
								);
								const playerName = opponent
									? opponent.name
									: `Jugador ${achievementOwnerId}`;

								const message = `${playerName} ha desbloqueado el logro "${achievementTitle}"`;

								const notifStore = useNotificationStore.getState();
								notifStore.addNotification({
									type: "achievement",
									message,
									iconKey: "achievement",
								});
								notifStore.addLog(message);
							}
						},
					);
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

				// 2.5 Procesamiento Síncrono de la Carta Extra
				if (data.player_drew_extra_card) {
					const state = useGameStore.getState();
					const myPlayerId = state.gameData?.me?.id;
					const opponents = state.gameData?.game?.opponents ?? [];

					const luckPlayerId = data.player_drew_extra_card;
					const isMe = String(myPlayerId) === String(luckPlayerId);

					let playerName = "Alguien";
					if (!isMe) {
						const opponent = opponents.find(
							(o: any) => String(o.id) === String(luckPlayerId),
						);
						if (opponent) playerName = opponent.name;
					}

					const message = isMe
						? "¡Has robado una carta extra!"
						: `${playerName} ha robado una carta extra`;

					useNotificationStore.getState().addNotification({
						type: "luck",
						message,
						iconKey: "luck",
					});
				}

				// 3. Sincronización general
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
