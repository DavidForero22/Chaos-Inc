// src/store/useAuthStore.ts

import { create } from "zustand";

interface AuthState {
	user: string | null;
	token: string | null;
	isGuest: boolean;
	role: string | null;
	setAuth: (
		user: string,
		token: string,
		isGuest?: boolean,
		role?: string,
	) => void;
	logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
	user: localStorage.getItem("user"),
	token: localStorage.getItem("token"),
	isGuest: localStorage.getItem("isGuest") === "true",
	role: localStorage.getItem("role"),

	setAuth: (user, token, isGuest = false, role = "user") => {
		localStorage.setItem("user", user);
		localStorage.setItem("token", token);
		localStorage.setItem("isGuest", String(isGuest));
		localStorage.setItem("role", role ?? "user");
		set({ user, token, isGuest, role });
	},

	logout: () => {
		localStorage.removeItem("user");
		localStorage.removeItem("token");
		localStorage.removeItem("isGuest");
		localStorage.removeItem("role");
		set({ user: null, token: null, isGuest: false, role: null });
	},
}));
