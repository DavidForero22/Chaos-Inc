// src/store/friends/useFriendsStore.ts

import { create } from "zustand";
import api, { getCsrfCookie } from "../../api/axios";
import type { FriendSummary, FriendRequest } from "../../types/user";

interface FriendsState {
	// Datos
	friends: FriendSummary[];
	pendingReceived: FriendRequest[];
	pendingSent: FriendRequest[];

	// UI
	isLoading: boolean;
	error: string | null;

	// Acciones
	fetchFriends: () => Promise<void>;
	fetchPendingReceived: () => Promise<void>;
	fetchPendingSent: () => Promise<void>;
	sendRequest: (userId: number) => Promise<boolean>;
	acceptRequest: (userId: number) => Promise<boolean>;
	rejectRequest: (userId: number) => Promise<boolean>;
	removeFriend: (userId: number) => Promise<boolean>;
	clearError: () => void;
}

export const useFriendsStore = create<FriendsState>((set, get) => ({
	friends: [],
	pendingReceived: [],
	pendingSent: [],
	isLoading: false,
	error: null,

	fetchFriends: async () => {
		set({ isLoading: true, error: null });
		try {
			const { data } = await api.get("/friends");
			set({ friends: data.data, isLoading: false });
		} catch (err: any) {
			set({
				error: err.response?.data?.message || "Error al cargar amigos",
				isLoading: false,
			});
		}
	},

	fetchPendingReceived: async () => {
		set({ isLoading: true, error: null });
		try {
			const { data } = await api.get("/friends/pending");
			set({ pendingReceived: data.data, isLoading: false });
		} catch (err: any) {
			set({
				error:
					err.response?.data?.message ||
					"Error al cargar solicitudes recibidas",
				isLoading: false,
			});
		}
	},

	fetchPendingSent: async () => {
		set({ isLoading: true, error: null });
		try {
			const { data } = await api.get("/friends/sent");
			set({ pendingSent: data.data, isLoading: false });
		} catch (err: any) {
			set({
				error:
					err.response?.data?.message || "Error al cargar solicitudes enviadas",
				isLoading: false,
			});
		}
	},

	sendRequest: async (userId: number) => {
		set({ isLoading: true, error: null });
		try {
			await getCsrfCookie();
			await api.post(`/friends/${userId}/request`);
			// Refrescar las listas para tener todo actualizado
			await get().fetchPendingSent();
			await get().fetchPendingReceived();
			set({ isLoading: false });
			return true;
		} catch (err: any) {
			set({
				error: err.response?.data?.message || "Error al enviar solicitud",
				isLoading: false,
			});
			return false;
		}
	},

	acceptRequest: async (userId: number) => {
		set({ isLoading: true, error: null });
		try {
			await getCsrfCookie();
			await api.post(`/friends/${userId}/accept`);
			await get().fetchFriends();
			await get().fetchPendingReceived();
			await get().fetchPendingSent();
			set({ isLoading: false });
			return true;
		} catch (err: any) {
			set({
				error: err.response?.data?.message || "Error al aceptar solicitud",
				isLoading: false,
			});
			return false;
		}
	},

	rejectRequest: async (userId: number) => {
		set({ isLoading: true, error: null });
		try {
			await getCsrfCookie();
			await api.post(`/friends/${userId}/reject`);
			await get().fetchPendingReceived();
			set({ isLoading: false });
			return true;
		} catch (err: any) {
			set({
				error: err.response?.data?.message || "Error al rechazar solicitud",
				isLoading: false,
			});
			return false;
		}
	},

	removeFriend: async (userId: number) => {
		set({ isLoading: true, error: null });
		try {
			await getCsrfCookie();
			await api.delete(`/friends/${userId}`);
			await get().fetchFriends();
			await get().fetchPendingSent(); // por si cancela una solicitud enviada
			set({ isLoading: false });
			return true;
		} catch (err: any) {
			set({
				error: err.response?.data?.message || "Error al eliminar amigo",
				isLoading: false,
			});
			return false;
		}
	},

	clearError: () => set({ error: null }),
}));
