// src/store/room/useRoomStore.ts

import { create } from "zustand";
import api from "../../api/axios";
import type { RoomData } from "../../types/api";
import { useNotificationStore } from "../ui/useNotificationStore";
import { useGameStore } from "../game/useGameStore";
import { useGameActions } from "../game/useGameActions";
import { useGameUIStore } from "../game/useGameUIStore";

export type AttemptJoinResult =
	| "JOINED"
	| "PASSWORD_REQUIRED"
	| "ERROR"
	| { type: string; message: string; status?: number };

const getRoleRevealKey = (roomId: string) => `role_reveal_shown:${roomId}`;

const initialRoomId = localStorage.getItem("active_room_id");
const initialIsFirstLoad = initialRoomId
	? !localStorage.getItem(getRoleRevealKey(initialRoomId))
	: true;

interface RoomState {
	// --- ESTADOS ---
	room: RoomData | null;
	roomId: string | null;
	isFirstLoad: boolean;
	isJoining: boolean;
	needsPassword: boolean;
	passwordError: string;
	hasToken: boolean;
	wasKicked: boolean;

	// --- ACCIONES LOCALES ---
	setRoom: (room: RoomData | null) => void;
	setRoomId: (id: string | null) => void;
	setIsJoining: (val: boolean) => void;
	setIsFirstLoad: (isFirstLoad: boolean) => void;
	resetRoomStore: (keepRoom?: boolean) => void;
	setWasKicked: (value: boolean) => void;

	// --- ACCIONES DE RED ---
	fetchRoomData: () => Promise<void>;
	attemptJoin: (
		password?: string,
		myPlayerName?: string,
	) => Promise<AttemptJoinResult>;
	leaveRoom: () => Promise<void>;
	startGame: () => Promise<void>;
	kickPlayer: (playerIdToKick: string) => Promise<void>;
}

export const useRoomStore = create<RoomState>((set, get) => ({
	// --- ESTADOS INICIALES ---
	room: null,
	roomId: initialRoomId,
	isFirstLoad: initialIsFirstLoad,
	isJoining: !initialRoomId,
	needsPassword: false,
	passwordError: "",
	hasToken: !!localStorage.getItem("game_token"),
	wasKicked: false,

	// --- ACCIONES LOCALES ---
	setRoom: (room) => {
		const previousRoomId = get().roomId; // usar estado explícito
		const newRoomId = room?.room_id;

		// Si cambia el roomId, limpiar notificaciones
		if (newRoomId && newRoomId !== previousRoomId) {
			useNotificationStore.getState().clearLogs();
		}

		// Gestionar localStorage del roomId
		if (newRoomId) {
			localStorage.setItem("active_room_id", newRoomId);
		} else if (!room) {
			localStorage.removeItem("active_room_id");
		}

		// Actualizar isFirstLoad basado en el nuevo roomId
		const isFirstLoad = newRoomId
			? !localStorage.getItem(getRoleRevealKey(newRoomId))
			: true;

		set({ room, roomId: newRoomId ?? null, isFirstLoad });
	},

	setRoomId: (id) => {
		const prevId = get().roomId;
		if (id !== prevId) {
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

	setIsJoining: (val) => set({ isJoining: val }),

	setIsFirstLoad: (isFirstLoad) => {
		const roomId = get().roomId;
		if (!isFirstLoad && roomId) {
			localStorage.setItem(getRoleRevealKey(roomId), "1");
		}
		set({ isFirstLoad });
	},

	resetRoomStore: (keepRoom = false) => {
		useNotificationStore.getState().clearLogs();
		useGameStore.getState().resetGameData();
		useGameUIStore.getState().resetGameUI();
		useGameActions.setState({ isActionLocked: false });

		if (!keepRoom) {
			localStorage.removeItem("active_room_id");
			localStorage.removeItem("game_token");

			cleanupRoomLocalStorage();

			set({
				room: null,
				roomId: null,
				isFirstLoad: true,
				isJoining: true,
				needsPassword: false,
				passwordError: "",
				hasToken: false,
			});
		} else {
			const currentRoom = get().room;
			const roomId = currentRoom?.room_id ?? get().roomId;

			cleanupRoomLocalStorage(roomId);

			const nextIsFirstLoad = roomId
				? !localStorage.getItem(getRoleRevealKey(roomId))
				: true;

			set({
				room: null,
				roomId: roomId, // mantener el id si keepRoom
				isFirstLoad: nextIsFirstLoad,
				isJoining: false,
				needsPassword: false,
				passwordError: "",
				hasToken: !!localStorage.getItem("game_token"),
			});
		}
	},

	// --- ACCIONES DE RED ---
	fetchRoomData: async () => {
		const roomId = get().roomId;
		if (!roomId) return;

		try {
			const res = await api.get(`/rooms/${encodeURIComponent(roomId)}`, {
				hideLoader: true,
			} as any);
			const currentRoom = res.data;

			//  Si el roomId cambió mientras se hacía la petición, descartar
			if (get().roomId !== roomId) {
				return;
			}

			if (currentRoom) {
				set({ room: currentRoom, roomId: currentRoom.room_id });
			} else {
				throw new Error("ROOM_NOT_FOUND");
			}
		} catch (error) {
			console.error("Error fetching room data", error);
			throw error;
		}
	},

	attemptJoin: async (password = "", myPlayerName) => {
		const roomId = get().roomId;
		if (!roomId || !myPlayerName) return "ERROR";

		set({ passwordError: "" });

		try {
			const res = await api.post(
				`/rooms/${encodeURIComponent(roomId)}/join`,
				{ password },
				{ hideLoader: true } as any,
			);

			if (res.data.game_token) {
				localStorage.setItem("game_token", res.data.game_token);
				set({ hasToken: true });
			}

			await get().fetchRoomData();
			set({ needsPassword: false, isJoining: false });
			return "JOINED";
		} catch (error: any) {
			console.log(error.response);
			const type = error.response?.data?.type;
			const errorMsg = error.response?.data?.error || ""; // Obtener el mensaje también

			if (type === "PASSWORD_REQUIRED" || type === "INCORRECT_PASSWORD") {
				set({
					needsPassword: true,
					isJoining: false,
					passwordError:
						type === "INCORRECT_PASSWORD" ? "Contraseña incorrecta." : "",
				});
				return "PASSWORD_REQUIRED";
			}

			// En vez de hacer throw, devuelve un objeto o un string con el tipo de error
			return {
				type: type || "ERROR",
				message: errorMsg,
				status: error.response?.status,
			};
		}
	},

	leaveRoom: async () => {
		const roomId = get().roomId;
		if (!roomId) return;

		try {
			await api.post(`/rooms/${encodeURIComponent(roomId)}/leave`);
		} catch (error: any) {
			if (error.response?.status !== 403) throw error;
		} finally {
			get().resetRoomStore(false);
		}
	},

	startGame: async () => {
		const roomId = get().roomId;
		if (!roomId) return;
		await api.post(`/rooms/${encodeURIComponent(roomId)}/start`);
	},

	kickPlayer: async (playerIdToKick) => {
		const roomId = get().roomId;
		if (!roomId) return;
		await api.post(`/rooms/${encodeURIComponent(roomId)}/kick`, {
			player_to_kick_id: playerIdToKick,
		});
	},

	setWasKicked: (value: boolean) => set({ wasKicked: value }),
}));

/**
 * Función de barrido de basura en LocalStorage
 */
const cleanupRoomLocalStorage = (roomIdToKeep?: string | null) => {
	const keysToRemove: string[] = [];

	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i);
		if (!key) continue;

		const isDeathModal = key.startsWith("death_modal_shown:");
		const isRoleReveal = key.startsWith("role_reveal_shown:");

		if (isDeathModal || isRoleReveal) {
			// Si esta manteniendo la sala (keepRoom = true),
			// NO borrar el role_reveal de ESTA sala para que no le salte la intro otra vez.
			// (Pero la muerte sí se borra, por si juegan otra partida en la misma sala).
			if (roomIdToKeep && key === getRoleRevealKey(roomIdToKeep)) {
				continue;
			}
			keysToRemove.push(key);
		}
	}

	keysToRemove.forEach((k) => localStorage.removeItem(k));
};

// Selector helper para obtener el roomId fácilmente
export const useRoomId = () => useRoomStore((state) => state.roomId);
