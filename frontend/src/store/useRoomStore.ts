// src/store/useRoomStore.ts

import { create } from "zustand";
import api from "../api/axios";
import type { RoomData } from "../types/api";
// import { logWithTime } from "../utils/logger";

interface RoomState {
	// --- ESTADOS ---
	room: RoomData | null;
	isJoining: boolean;
	needsPassword: boolean;
	passwordError: string;
	roomId: string | null;
	hasToken: boolean;

	// --- ACCIONES LOCALES ---
	setRoomId: (id: string | null) => void;
	setRoom: (room: RoomData | null) => void;
	setIsJoining: (val: boolean) => void;
	resetRoomStore: () => void;

	// --- ACCIONES DE RED ---
	fetchRoomData: () => Promise<void>;
	attemptJoin: (
		password?: string,
		myPlayerName?: string,
	) => Promise<string | "JOINED" | "PASSWORD_REQUIRED">;
	leaveRoom: () => Promise<void>;
	startGame: () => Promise<void>;
	kickPlayer: (playerName: string) => Promise<void>;
}

export const useRoomStore = create<RoomState>((set, get) => ({
	room: null,
	isJoining: true,
	needsPassword: false,
	passwordError: "",
	roomId: null,
	hasToken: !!localStorage.getItem("game_token"),

	setRoomId: (id) => set({ roomId: id }),
	setRoom: (room) => set({ room }),
	setIsJoining: (val) => set({ isJoining: val }),

	resetRoomStore: () =>
		set({
			room: null,
			isJoining: true,
			needsPassword: false,
			passwordError: "",
			roomId: null,
			hasToken: false,
		}),

	fetchRoomData: async () => {
		const { roomId } = get();
		if (!roomId) return;

		try {
			// Pedir solo la sala específica al backend
			const res = await api.get(`/rooms/${encodeURIComponent(roomId)}`, {
				hideLoader: true,
			} as any);
			const currentRoom = res.data.data ?? res.data;

			if (currentRoom) {
				set({ room: currentRoom });
			} else {
				throw new Error("ROOM_NOT_FOUND");
			}
		} catch (error) {
			console.error("Error fetching room data", error);
			throw error;
		}
	},

	attemptJoin: async (password = "", myPlayerName) => {
		const { roomId, fetchRoomData } = get();
		if (!roomId || !myPlayerName) return "ERROR";

		set({ passwordError: "" });

		try {
			const res = await api.post(`/rooms/${encodeURIComponent(roomId)}/join`, { password }, {
				hideLoader: true,
			} as any);

			if (res.data.game_token) {
				localStorage.setItem("game_token", res.data.game_token);
				set({ hasToken: true });
			}

			await fetchRoomData();
			set({ needsPassword: false, isJoining: false });
			return "JOINED";
		} catch (error: any) {
			const type = error.response?.data?.type;
			if (type === "PASSWORD_REQUIRED" || type === "INCORRECT_PASSWORD") {
				set({
					needsPassword: true,
					isJoining: false,
					passwordError:
						type === "INCORRECT_PASSWORD" ? "Contraseña incorrecta." : "",
				});
				return "PASSWORD_REQUIRED";
			}
			throw error;
		}
	},

	leaveRoom: async () => {
		const { roomId } = get();
		if (!roomId) return;
		try {
			await api.post(`/rooms/${encodeURIComponent(roomId)}/leave`);
		} catch (error: any) {
			// Ignorar 403 — el token puede haber expirado o el jugador fue kickeado
			if (error.response?.status !== 403) throw error;
		} finally {
			localStorage.removeItem("game_token");
			get().resetRoomStore();
		}
	},

	startGame: async () => {
		const { roomId } = get();
		if (!roomId) return;
		await api.post(`/rooms/${encodeURIComponent(roomId)}/start`);
	},

	kickPlayer: async (playerToKick) => {
		const { roomId } = get();
		if (!roomId) return;
		await api.post(`/rooms/${encodeURIComponent(roomId)}/kick`, { player_to_kick: playerToKick });
	},
}));
