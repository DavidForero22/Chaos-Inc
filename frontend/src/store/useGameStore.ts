// src/store/useGameStore.ts

import { create } from "zustand";
import api from "../api/axios";
import { logWithTime } from "../utils/logger";
import type { GameData } from "../types/live-game";

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
	logs: LogEntry[];
	isActionLocked: boolean;

	setRoomId: (id: string | null) => void;
	setGameData: (data: GameData | null) => void;
	setIsConnecting: (isConnecting: boolean) => void;
	setIsFirstLoad: (isFirstLoad: boolean) => void;
	setGameOver: (gameOver: boolean) => void;
	setShowActingBossModal: (show: boolean) => void;
	addLog: (message: string) => void;
	clearLogs: () => void;
	setIsActionLocked: (locked: boolean) => void;

	applyGameData: (newGameData: GameData) => void;
	syncGame: () => Promise<void>;
	playTurn: (
		cardId: string,
		targetName: string,
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

export const useGameStore = create<GameState>((set, get) => ({
	roomId: localStorage.getItem("active_room_id"),
	gameData: null,
	isConnecting: true,
	isFirstLoad: true,
	gameOver: false,
	showActingBossModal: false,
	logs: [],
	isActionLocked: false,

	setRoomId: (id) => {
		if (id) {
			localStorage.setItem("active_room_id", id);
		} else {
			localStorage.removeItem("active_room_id");
		}
		set({ roomId: id });
	},
	setGameData: (data) => set({ gameData: data }),
	setIsConnecting: (isConnecting) => set({ isConnecting }),
	setIsFirstLoad: (isFirstLoad) => set({ isFirstLoad }),
	setGameOver: (gameOver) => set({ gameOver }),
	setShowActingBossModal: (show) => set({ showActingBossModal: show }),
	setIsActionLocked: (locked) => set({ isActionLocked: locked }),

	addLog: (message) =>
		set((state) => {
			const now = new Date();
			const timestamp = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
			const newEntry: LogEntry = {
				id: crypto.randomUUID(),
				timestamp,
				message,
			};
			return { logs: [...state.logs, newEntry] };
		}),
	clearLogs: () => set({ logs: [] }),

	resetStore: (keepRoomId = false) => {
		if (!keepRoomId) {
			localStorage.removeItem("active_room_id");
		}

		set((state) => ({
			roomId: keepRoomId ? state.roomId : null,
			gameData: null,
			isConnecting: true,
			isFirstLoad: true,
			gameOver: false,
			showActingBossModal: false,
			logs: [],
			isActionLocked: false,
		}));
	},

	applyGameData: (newGameData: GameData) => {
		const currentData = get().gameData;

		const isNowActingBoss = newGameData?.me?.conditions?.acting_boss === true;
		const wasActingBoss = currentData?.me?.conditions?.acting_boss === true;

		if (isNowActingBoss && !wasActingBoss) {
			logWithTime("Cambio detectado: ¡Eres el nuevo Jefe Heredado!");
			set({ showActingBossModal: true });
		}

		set({ gameData: newGameData, isActionLocked: false });

		if (newGameData.game?.game_over) {
			set({ gameOver: true });
			localStorage.removeItem("game_token");
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
			console.error("ERROR en /sync:", error);
			throw error;
		} finally {
			set({ isActionLocked: false });
		}
	},

	playTurn: async (cardId, targetName, perkKey) => {
		const { roomId, applyGameData, isActionLocked } = get();
		if (!roomId || isActionLocked) return false;

		set({ isActionLocked: true });
		try {
			const res = await api.post(
				`/rooms/${encodeURIComponent(roomId)}/action`,
				{
					card_id: cardId,
					target_name: targetName,
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
