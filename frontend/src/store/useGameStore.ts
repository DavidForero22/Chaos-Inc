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

	setRoomId: (id: string | null) => void;
	setGameData: (data: GameData | null) => void;
	setIsConnecting: (isConnecting: boolean) => void;
	setIsFirstLoad: (isFirstLoad: boolean) => void;
	setGameOver: (gameOver: boolean) => void;
	setShowActingBossModal: (show: boolean) => void;
	addLog: (message: string) => void;
	clearLogs: () => void;

	syncGame: () => Promise<void>;
	playTurn: (cardId: string, targetName: string) => Promise<boolean>;
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
	resetStore: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
	roomId: null,
	gameData: null,
	isConnecting: true,
	isFirstLoad: true,
	gameOver: false,
	showActingBossModal: false,
	logs: [],

	setRoomId: (id) => set({ roomId: id }),
	setGameData: (data) => set({ gameData: data }),
	setIsConnecting: (isConnecting) => set({ isConnecting }),
	setIsFirstLoad: (isFirstLoad) => set({ isFirstLoad }),
	setGameOver: (gameOver) => set({ gameOver }),
	setShowActingBossModal: (show) => set({ showActingBossModal: show }),

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

	resetStore: () =>
		set({
			roomId: null,
			gameData: null,
			isConnecting: true,
			isFirstLoad: true,
			gameOver: false,
			showActingBossModal: false,
			logs: [],
		}),

	syncGame: async () => {
		const { roomId } = get();
		if (!roomId) return;

		if (!localStorage.getItem("game_token")) {
			console.warn(
				"Ignorando sync prematuro: aún estamos obteniendo el token.",
			);
			return;
		}

		try {
			const res = await api.post(`/rooms/${roomId}/sync`);

			if (!res || res.data === null) {
				return;
			}

			const newGameData = res.data;
			const currentData = get().gameData;

			const isNowActingBoss = newGameData?.me?.conditions?.acting_boss === true;
			const wasActingBoss = currentData?.me?.conditions?.acting_boss === true;

			if (isNowActingBoss && !wasActingBoss) {
				logWithTime(
					"useGameStore.ts - Cambio detectado: ¡Eres el nuevo Jefe Heredado!",
				);
				set({ showActingBossModal: true });
			}

			set({ gameData: newGameData });

			if (newGameData.game?.game_over) {
				set({ gameOver: true });
				localStorage.removeItem("game_token");
			}
		} catch (error: any) {
			console.error("ERROR en /sync:", error);
			throw error;
		}
	},

	playTurn: async (cardId, targetName) => {
		const { roomId, syncGame } = get();
		if (!roomId) return false;

		try {
			await api.post(`/rooms/${roomId}/action`, {
				card_id: cardId,
				target_name: targetName,
			});
			await syncGame();
			return true;
		} catch (error: any) {
			logWithTime("useGameStore.ts - Error playing turn. ", error);
			alert(error.response?.data?.message || "Error al jugar la carta.");
			return false;
		}
	},

	reactToAttack: async (reaction, cardId) => {
		const { roomId, syncGame } = get();
		if (!roomId) return false;

		try {
			await api.post(`/rooms/${roomId}/react`, {
				reaction,
				card_id: cardId,
			});
			await syncGame();
			return true;
		} catch (error: any) {
			logWithTime("useGameStore.ts - Error reacting to attack. ", error);
			alert(error.response?.data?.message || "Error al reaccionar al ataque.");
			return false;
		}
	},

	reactToMultiAttack: async (reaction, cardId) => {
		const { roomId, syncGame } = get();
		if (!roomId) return false;

		try {
			await api.post(`/rooms/${roomId}/react-multi`, {
				reaction,
				card_id: cardId,
			});
			await syncGame();
			return true;
		} catch (error: any) {
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
		const { roomId, syncGame } = get();
		if (!roomId) return;
		await api.post(`/rooms/${roomId}/end-turn`, {});
		await syncGame();
	},

	discardCards: async (cardIds: string[]) => {
		const { roomId, syncGame } = get();
		if (!roomId) return;

		try {
			await api.post(`/rooms/${roomId}/discard`, { card_ids: cardIds });
			await syncGame();
		} catch (error: any) {
			alert(error.response?.data?.message || "Error al descartar cartas.");
		}
	},
}));
