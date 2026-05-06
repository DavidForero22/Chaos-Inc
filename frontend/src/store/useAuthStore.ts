// src/store/useAuthStore.ts

import { create } from "zustand";

interface AuthState {
	id: number | null;
	user: string | null;
	avatar: string | null;
	providerAvatar: string | null;
	isGuest: boolean;
	role: string | null;
	provider: string | null;
	joinedAt: string | null; 
	setAuth: (
		id: number | null,
		user: string,
		avatar?: string | null,
		isGuest?: boolean,
		role?: string,
		provider?: string | null,
		providerAvatar?: string | null,
		joinedAt?: string | null, 
	) => void;
	setAvatar: (avatar: string | null) => void;
	logout: () => void;
}

// Helper seguro para entornos SSR / Tests (evita crashes si 'window' no existe)
const getSafeStorage = (key: string): string | null => {
	if (typeof window !== "undefined") {
		return localStorage.getItem(key);
	}
	return null;
};

export const useAuthStore = create<AuthState>((set) => ({
	id: Number(getSafeStorage("userId")) || null,
	user: getSafeStorage("user"),
	avatar: getSafeStorage("avatar"),
	providerAvatar: getSafeStorage("providerAvatar"),
	isGuest: getSafeStorage("isGuest") === "true",
	role: getSafeStorage("role"),
	provider: getSafeStorage("provider"),
	joinedAt: getSafeStorage("joinedAt"), 

	setAuth: (
		id,
		user,
		avatar = null,
		isGuest = false,
		role = "user",
		provider = null,
		providerAvatar = null,
		joinedAt = null, 
	) => {
		if (typeof window !== "undefined") {
			localStorage.setItem("userId", String(id));
			localStorage.setItem("user", user);

			if (avatar) localStorage.setItem("avatar", avatar);
			else localStorage.removeItem("avatar");

			if (providerAvatar)
				localStorage.setItem("providerAvatar", providerAvatar);
			else localStorage.removeItem("providerAvatar");

			localStorage.setItem("isGuest", String(isGuest));
			localStorage.setItem("role", role ?? "user");

			if (provider) localStorage.setItem("provider", provider);
			else localStorage.removeItem("provider");

			if (joinedAt) localStorage.setItem("joinedAt", joinedAt);
			else localStorage.removeItem("joinedAt");
		}
		set({
			id,
			user,
			avatar,
			providerAvatar,
			isGuest,
			role,
			provider,
			joinedAt,
		});
	},

	setAvatar: (avatar) => {
		if (typeof window !== "undefined") {
			if (avatar) localStorage.setItem("avatar", avatar);
			else localStorage.removeItem("avatar");
		}
		set({ avatar });
	},

	logout: () => {
		if (typeof window !== "undefined") {
			localStorage.removeItem("userId");
			localStorage.removeItem("user");
			localStorage.removeItem("avatar");
			localStorage.removeItem("providerAvatar");
			localStorage.removeItem("isGuest");
			localStorage.removeItem("role");
			localStorage.removeItem("provider");
			localStorage.removeItem("joinedAt"); 
		}
		set({
			id: null,
			user: null,
			avatar: null,
			providerAvatar: null,
			isGuest: false,
			role: null,
			provider: null,
			joinedAt: null,
		});
	},
}));

// Sincronización entre múltiples pestañas
if (typeof window !== "undefined") {
	window.addEventListener("storage", (event) => {
		// Si el evento afecta a variables de autenticación, sincronizar el estado de Zustand
		if (
			event.key === "user" ||
			event.key === "avatar" ||
			event.key === "providerAvatar" ||
			event.key === "isGuest" ||
			event.key === "role" ||
			event.key === "provider" ||
			event.key === "joinedAt" 
		) {
			useAuthStore.setState({
				user: getSafeStorage("user"),
				avatar: getSafeStorage("avatar"),
				providerAvatar: getSafeStorage("providerAvatar"),
				isGuest: getSafeStorage("isGuest") === "true",
				role: getSafeStorage("role"),
				provider: getSafeStorage("provider"),
				joinedAt: getSafeStorage("joinedAt"),
			});
		}
	});
}
