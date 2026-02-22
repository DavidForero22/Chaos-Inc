import { create } from "zustand";

interface AuthState {
	user: string | null;
	token: string | null;
	setAuth: (user: string, token: string) => void;
	logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
	user: localStorage.getItem("user"),
	token: localStorage.getItem("token"),

	setAuth: (user, token) => {
		localStorage.setItem("user", user);
		localStorage.setItem("token", token);
		set({ user, token });
	},

	logout: () => {
		localStorage.removeItem("user");
		localStorage.removeItem("token");
		set({ user: null, token: null });
	},
}));
