// src/store/game/useGameStore.ts

import { create } from "zustand";
import api from "../../api/axios";
import type { GameData } from "../../types/live-game";
import { useNotificationStore } from "../ui/useNotificationStore";
import { useRoomStore } from "../room/useRoomStore";

export interface LogEntry {
	id: string;
	timestamp: string;
	message: string;
}

interface GameState {
	// --- ESTADOS DEL JUEGO ---
	gameData: GameData | null;
	isConnecting: boolean;
	gameOver: boolean;

	// --- ACCIONES ---
	setGameData: (data: GameData | null) => void;
	setIsConnecting: (isConnecting: boolean) => void;
	setGameOver: (gameOver: boolean) => void;
	applyGameData: (newGameData: GameData) => void;
	syncGame: () => Promise<void>;
	resetGameData: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
	// --- ESTADOS INICIALES ---
	gameData: null,
	isConnecting: true,
	gameOver: false,

	// --- ACCIONES SIMPLES ---
	setGameData: (data) => set({ gameData: data }),
	setIsConnecting: (isConnecting) => set({ isConnecting }),
	setGameOver: (gameOver) => set({ gameOver }),

	// --- LÓGICA DE NEGOCIO ---
	applyGameData: (newGameData: GameData) => {
		const currentData = get().gameData;

		// Limpiar logs si el juego se reinicia (estaba en game over y ahora no)
		if (get().gameOver && newGameData.game && !newGameData.game.game_over) {
			useNotificationStore.getState().clearLogs();
		}

		// Detectar si el jugador se convierte en jefe interino
		const isNowActingBoss = newGameData?.me?.conditions?.acting_boss === true;
		const wasActingBoss = currentData?.me?.conditions?.acting_boss === true;

		if (isNowActingBoss && !wasActingBoss) {
			// Importación dinámica para evitar dependencia circular
			const { useGameUIStore } = require("./useGameUIStore");
			useGameUIStore.getState().setShowActingBossModal(true);
		}

		// Actualizar datos del juego
		set({ gameData: newGameData });

		// Manejar fin del juego
		if (newGameData.game?.game_over) {
			set({ gameOver: true });
			localStorage.removeItem("game_token");

			// Limpiar el flag de role reveal usando el roomId de useRoomStore
			const roomId = useRoomStore.getState().room?.room_id;
			if (roomId) {
				const getRoleRevealKey = (rid: string) => `role_reveal_shown:${rid}`;
				localStorage.removeItem(getRoleRevealKey(roomId));
			}
		} else {
			set({ gameOver: false });
		}
	},

	syncGame: async () => {
		// Obtener roomId del useRoomStore
		const roomId = useRoomStore.getState().room?.room_id;
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

			get().applyGameData(res.data);
		} catch (error: any) {
			throw error;
		}
	},

	resetGameData: () => {
		// Solo resetea los datos del juego, no toca localStorage
		// El useRoomStore se encarga de limpiar el resto cuando sea necesario
		set({
			gameData: null,
			isConnecting: true,
			gameOver: false,
		});
	},
}));
