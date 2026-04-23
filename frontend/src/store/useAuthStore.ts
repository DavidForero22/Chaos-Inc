// src/store/useAuthStore.ts

import { create } from "zustand";

interface AuthState {
	user: string | null;
	isGuest: boolean;
	role: string | null;
	setAuth: (user: string, isGuest?: boolean, role?: string) => void;
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
	user: getSafeStorage("user"),
	isGuest: getSafeStorage("isGuest") === "true",
	role: getSafeStorage("role"),

	setAuth: (user, isGuest = false, role = "user") => {
		if (typeof window !== "undefined") {
			localStorage.setItem("user", user);
			localStorage.setItem("isGuest", String(isGuest));
			localStorage.setItem("role", role ?? "user");
		}
		set({ user, isGuest, role });
	},

	logout: () => {
		if (typeof window !== "undefined") {
			localStorage.removeItem("user");
			localStorage.removeItem("isGuest");
			localStorage.removeItem("role");
		}
		set({ user: null, isGuest: false, role: null });
	},
}));

// Sincronización entre múltiples pestañas
if (typeof window !== "undefined") {
	window.addEventListener("storage", (event) => {
		// Si el evento afecta a variables de autenticación, sincronizar el estado de Zustand
		if (
			event.key === "user" ||
			event.key === "isGuest" ||
			event.key === "role"
		) {
			useAuthStore.setState({
				user: getSafeStorage("user"),
				isGuest: getSafeStorage("isGuest") === "true",
				role: getSafeStorage("role"),
			});
		}
	});
}
