// src/store/useGameStore.ts

import { create } from "zustand";
import api from "../api/axios";
import { logWithTime } from "../utils/logger";
import type { GameData } from "../types/live-game";
import { useNotificationStore } from "./useNotificationStore.ts";

export interface LogEntry {
	id: string;
	timestamp: string;
	message: string;
}

interface GameState {
	roomId: string | null;
	gameData: GameData | null;
	isConnecting: boolean;
	isFirstLoad: boolean;
	gameOver: boolean;
	showActingBossModal: boolean;
	isActionLocked: boolean;
	matchAchievements: string[];

	setRoomId: (id: string | null) => void;
	setGameData: (data: GameData | null) => void;
	setIsConnecting: (isConnecting: boolean) => void;
	setIsFirstLoad: (isFirstLoad: boolean) => void;
	setGameOver: (gameOver: boolean) => void;
	setShowActingBossModal: (show: boolean) => void;
	setIsActionLocked: (locked: boolean) => void;
	addMatchAchievement: (achievementId: string) => void;
	clearMatchAchievements: () => void;

	applyGameData: (newGameData: GameData) => void;
	syncGame: () => Promise<void>;
	playTurn: (
		cardId: string,
		targetId: string,
		perkKey?: string,
	) => Promise<boolean>;
	reactToAttack: (
		reaction: "dodge" | "accept",
		cardId?: string,
	) => Promise<boolean>;
	reactToMultiAttack: (
		reaction: "dodge" | "accept",
		cardId?: string,
	) => Promise<boolean>;
	endTurn: () => Promise<void>;
	discardCards: (cardIds: string[]) => Promise<void>;
	discardPerks: (perkIds: string[]) => Promise<void>;
	resolveSabotage: (cardId: string) => Promise<void>;
	resetStore: (keepRoomId?: boolean) => void;
}

const getRoleRevealKey = (roomId: string) => `role_reveal_shown:${roomId}`;

const initialRoomId = localStorage.getItem("active_room_id");
const initialIsFirstLoad = initialRoomId
	? !localStorage.getItem(getRoleRevealKey(initialRoomId))
	: true;

export const useGameStore = create<GameState>((set, get) => ({
	roomId: initialRoomId,
	gameData: null,
	isConnecting: true,
	isFirstLoad: initialIsFirstLoad,
	gameOver: false,
	showActingBossModal: false,
	isActionLocked: false,
	matchAchievements: [],

	setRoomId: (id) => {
		if (id !== get().roomId) {
			useNotificationStore.getState().clearLogs();
		}

		if (id) {
			localStorage.setItem("active_room_id", id);
		} else {
			localStorage.removeItem("active_room_id");
		}

		const isFirstLoad = id ? !localStorage.getItem(getRoleRevealKey(id)) : true;

		set({ roomId: id, isFirstLoad });
	},
	setGameData: (data) => set({ gameData: data }),
	setIsConnecting: (isConnecting) => set({ isConnecting }),
	setIsFirstLoad: (isFirstLoad) => {
		const roomId = get().roomId;
		if (!isFirstLoad && roomId) {
			localStorage.setItem(getRoleRevealKey(roomId), "1");
		}
		set({ isFirstLoad });
	},
	setGameOver: (gameOver) => set({ gameOver }),
	setShowActingBossModal: (show) => set({ showActingBossModal: show }),
	setIsActionLocked: (locked) => set({ isActionLocked: locked }),
	addMatchAchievement: (achievementId) =>
		set((state) => ({
			matchAchievements: state.matchAchievements.includes(achievementId)
				? state.matchAchievements
				: [...state.matchAchievements, achievementId],
		})),
	clearMatchAchievements: () => set({ matchAchievements: [] }),

	resetStore: (keepRoomId = false) => {
		useNotificationStore.getState().clearLogs();

		if (!keepRoomId) {
			localStorage.removeItem("active_room_id");
		}

		set((state) => {
			const nextRoomId = keepRoomId ? state.roomId : null;
			const nextIsFirstLoad = nextRoomId
				? !localStorage.getItem(getRoleRevealKey(nextRoomId))
				: true;

			return {
				roomId: nextRoomId,
				gameData: null,
				isConnecting: true,
				isFirstLoad: nextIsFirstLoad,
				gameOver: false,
				showActingBossModal: false,
				isActionLocked: false,
				matchAchievements: [],
			};
		});
	},

	applyGameData: (newGameData: GameData) => {
		const currentData = get().gameData;

		if (get().gameOver && newGameData.game && !newGameData.game.game_over) {
			useNotificationStore.getState().clearLogs();
		}

		const isNowActingBoss = newGameData?.me?.conditions?.acting_boss === true;
		const wasActingBoss = currentData?.me?.conditions?.acting_boss === true;

		if (isNowActingBoss && !wasActingBoss) {
			logWithTime("Eres el nuevo Jefe Heredado");
			set({ showActingBossModal: true });
		}

		set({ gameData: newGameData, isActionLocked: false });

		if (newGameData.game?.game_over) {
			set({ gameOver: true });
			localStorage.removeItem("game_token");

			const roomId = get().roomId;
			if (roomId) {
				localStorage.removeItem(getRoleRevealKey(roomId));
			}
		} else {
			set({ gameOver: false });
		}
	},

	syncGame: async () => {
		const { roomId, applyGameData } = get();
		if (!roomId) return;
		if (!localStorage.getItem("game_token")) return;

		try {
			const res = await api.post(
				`/rooms/${encodeURIComponent(roomId)}/sync`,
				{},
				{
					hideLoader: true,
				} as any,
			);

			if (!res || res.data === null) return;

			applyGameData(res.data);
		} catch (error: any) {
			// Si el backend dice que el juego no ha empezado, es que está en el Lobby .
			if (
				error.response?.status === 400 &&
				error.response?.data?.type === "GAME_NOT_STARTED"
			) {
				return;
			}

			console.error("ERROR en /sync:", error);
			throw error;
		} finally {
			set({ isActionLocked: false });
		}
	},

	playTurn: async (cardId, targetId, perkKey) => {
		const { roomId, applyGameData, isActionLocked } = get();
		if (!roomId || isActionLocked) return false;

		set({ isActionLocked: true });
		try {
			const res = await api.post(
				`/rooms/${encodeURIComponent(roomId)}/action`,
				{
					card_id: cardId,
					target_id: targetId,
					...(perkKey && { perk_key: perkKey }),
				},
			);
			applyGameData(res.data);
			return true;
		} catch (error: any) {
			set({ isActionLocked: false });
			logWithTime("useGameStore.ts - Error playing turn. ", error);
			alert(error.response?.data?.message || "Error al jugar la carta.");
			return false;
		}
	},

	reactToAttack: async (reaction, cardId) => {
		const { roomId, applyGameData, isActionLocked } = get();
		if (!roomId || isActionLocked) return false;

		set({ isActionLocked: true });
		try {
			const res = await api.post(`/rooms/${encodeURIComponent(roomId)}/react`, {
				reaction,
				card_id: cardId,
			});
			applyGameData(res.data);
			return true;
		} catch (error: any) {
			set({ isActionLocked: false });
			logWithTime("useGameStore.ts - Error reacting to attack. ", error);
			alert(error.response?.data?.message || "Error al reaccionar al ataque.");
			return false;
		}
	},

	reactToMultiAttack: async (reaction, cardId) => {
		const { roomId, applyGameData, isActionLocked } = get();
		if (!roomId || isActionLocked) return false;

		set({ isActionLocked: true });
		try {
			const res = await api.post(
				`/rooms/${encodeURIComponent(roomId)}/react-multi`,
				{
					reaction,
					card_id: cardId,
				},
			);
			applyGameData(res.data);
			return true;
		} catch (error: any) {
			set({ isActionLocked: false });
			if (error.response?.status === 422) return false;
			logWithTime("useGameStore.ts - Error reacting to multi attack. ", error);
			alert(
				error.response?.data?.message ||
					"Error al reaccionar al ataque masivo.",
			);
			return false;
		}
	},

	endTurn: async () => {
		const { roomId, applyGameData, isActionLocked } = get();
		if (!roomId || isActionLocked) return;

		set({ isActionLocked: true });
		try {
			const res = await api.post(
				`/rooms/${encodeURIComponent(roomId)}/end-turn`,
				{},
			);
			applyGameData(res.data);
		} catch (error) {
			set({ isActionLocked: false });
		}
	},

	discardCards: async (cardIds: string[]) => {
		const { roomId, applyGameData, isActionLocked } = get();
		if (!roomId || isActionLocked) return;

		set({ isActionLocked: true });
		try {
			const res = await api.post(
				`/rooms/${encodeURIComponent(roomId)}/discard`,
				{
					card_ids: cardIds,
				},
			);
			applyGameData(res.data);
		} catch (error: any) {
			set({ isActionLocked: false });
			alert(error.response?.data?.message || "Error al descartar cartas.");
		}
	},

	discardPerks: async (perkIds: string[]) => {
		const { roomId, applyGameData, isActionLocked } = get();
		if (!roomId || isActionLocked) return;

		set({ isActionLocked: true });
		try {
			const res = await api.post(
				`/rooms/${encodeURIComponent(roomId)}/discard-perks`,
				{
					perk_ids: perkIds,
				},
			);
			applyGameData(res.data);
		} catch (error: any) {
			set({ isActionLocked: false });
			alert(
				error.response?.data?.message || "Error al descartar el equipamiento.",
			);
		}
	},

	resolveSabotage: async (cardId: string) => {
		const { roomId, applyGameData, isActionLocked } = get();
		if (!roomId || isActionLocked) return;

		set({ isActionLocked: true });
		try {
			const res = await api.post(
				`/rooms/${encodeURIComponent(roomId)}/react-discard`,
				{
					card_id: cardId,
				},
			);
			applyGameData(res.data);
		} catch (error) {
			set({ isActionLocked: false });
			console.error("Error al descartar por sabotaje:", error);
		}
	},
}));
