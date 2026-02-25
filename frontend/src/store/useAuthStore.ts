import { create } from "zustand";

interface AuthState {
	user: string | null;
	token: string | null;
	isGuest: boolean;
	setAuth: (user: string, token: string, isGuest?: boolean) => void;
	logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
	user: localStorage.getItem("user"),
	token: localStorage.getItem("token"),
	isGuest: localStorage.getItem("isGuest") === "true",

	setAuth: (user, token, isGuest = false) => {
		localStorage.setItem("user", user);
		localStorage.setItem("token", token);
		localStorage.setItem("isGuest", String(isGuest));
		set({ user, token, isGuest });
	},

	logout: () => {
		localStorage.removeItem("user");
		localStorage.removeItem("token");
		localStorage.removeItem("isGuest");
		set({ user: null, token: null, isGuest: false });
	},
}));
