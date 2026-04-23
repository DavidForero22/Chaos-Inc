// src/store/useAuthStore.ts

import { create } from "zustand";

interface AuthState {
	user: string | null;
	isGuest: boolean;
	role: string | null;
	setAuth: (user: string, isGuest?: boolean, role?: string) => void;
	logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
	user: localStorage.getItem("user"),
	isGuest: localStorage.getItem("isGuest") === "true",
	role: localStorage.getItem("role"),

	setAuth: (user, isGuest = false, role = "user") => {
		localStorage.setItem("user", user);
		localStorage.setItem("isGuest", String(isGuest));
		localStorage.setItem("role", role ?? "user");
		set({ user, isGuest, role });
	},

	logout: () => {
		localStorage.removeItem("user");
		localStorage.removeItem("isGuest");
		localStorage.removeItem("role");
		set({ user: null, isGuest: false, role: null });
	},
}));
