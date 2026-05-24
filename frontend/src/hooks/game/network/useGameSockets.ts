// src/hooks/game/useGameSockets.ts

import { useEffect } from "react";
import echo from "../../../echo";
import { logWithTime } from "../../../utils/logger";
import { useGameStore } from "../../../store/game/useGameStore.ts";
import { useNotificationStore } from "../../../store/ui/useNotificationStore.ts";
import { useGameEventParser } from "../core/useGameEventParser.ts";

import api from "../../../api/axios.ts";
import { ACHIEVEMENTS } from "../../../data/app/achievements.ts";
import { useAchievementNotificationStore } from "../../../store/ui/useAchievementNotificationStore.ts";
import { useGameUIStore } from "../../../store/game/useGameUIStore.ts";
import { useAuthStore } from "../../../store/auth/useAuthStore.ts";

interface UseGameSocketsProps {
	roomId: string | undefined;
}

type AchievementNotificationPayload = {
	playerId: string | number;
	achievementId: string;
};

export function useGameSockets({ roomId }: UseGameSocketsProps) {
	const { parseAndNotify } = useGameEventParser();
	const { id: userId, isGuest } = useAuthStore();

	useEffect(() => {
		if (!roomId) return;

		const roomChannel = echo.join(`room.${roomId}`);
		let syncTimeout: ReturnType<typeof setTimeout> | null = null;

		roomChannel
			.here((users: any[]) => {
				logWithTime(
					`useGameSockets.ts::.here - Hay ${users.length} usuarios en la sala.`,
				);
			})
			.joining((user: any) => {
				logWithTime(
					`useGameSockets.ts::.joining - ${user.username} se ha conectado al socket.`,
				);
				// Sincronizar si vuelve alguien (reconexión rápida)
				const state = useGameStore.getState();
				if (!state.isConnecting && !state.gameOver) {
					state.syncGame().catch(() => {});
				}
			})
			.leaving((user: any) => {
				const state = useGameStore.getState();
				if (state.gameOver) return;

				logWithTime(
					`useGameSockets.ts::.leaving - Socket cerrado para ${user.username} (ID: ${user.id}). Avisando al servidor INMEDIATAMENTE.`,
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
								useGameUIStore.getState().addMatchAchievement(achievementId);
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

				// Si el juego acabó, ignorar actualizaciones
				if (state.gameOver) return;

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
						useGameStore
							.getState()
							.syncGame()
							.catch(() => {});
						syncTimeout = null;
					}, 100);
				}
			});

		return () => {
			roomChannel.stopListening(".RoomStateUpdated");
			echo.leave(`room.${roomId}`);
		};
	}, [roomId]);

	// Suscripción al canal privado del usuario para recibir el resumen de XP
	useEffect(() => {
		if (!userId || isGuest) return;

		const privateChannel = echo.private(`users.${userId}`);

		privateChannel.listen(".GameFinalized", (data: { xp_summary: any }) => {
			if (data?.xp_summary) {
				useGameStore.getState().setXpSummary(data.xp_summary);
			}
		});

		return () => {
			privateChannel.stopListening(".GameFinalized");
			echo.leave(`users.${userId}`);
		};
	}, [userId, isGuest]);
}
