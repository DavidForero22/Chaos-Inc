// src/store/useAuthStore.ts

import { create } from "zustand";
import type { UserAchievement, SocialAccountInfo } from "../types/api";

interface AuthState {
	id: number | null;
	user: string | null;
	avatar: string | null;
	isGuest: boolean;
	role: string | null;
	socialAccounts: SocialAccountInfo[] | null;
	joinedAt: string | null;
	achievements: UserAchievement[] | null;
	setAuth: (
		id: number | null,
		user: string,
		avatar?: string | null,
		isGuest?: boolean,
		role?: string,
		socialAccounts?: SocialAccountInfo[] | null,
		joinedAt?: string | null,
		achievements?: UserAchievement[] | null,
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

const getSafeJSON = <T>(key: string): T | null => {
	try {
		const raw = getSafeStorage(key);
		return raw ? (JSON.parse(raw) as T) : null;
	} catch {
		return null;
	}
};

export const useAuthStore = create<AuthState>((set) => ({
	id: Number(getSafeStorage("userId")) || null,
	user: getSafeStorage("user"),
	avatar: getSafeStorage("avatar"),
	isGuest: getSafeStorage("isGuest") === "true",
	role: getSafeStorage("role"),
	socialAccounts: getSafeJSON<SocialAccountInfo[]>("socialAccounts"),
	joinedAt: getSafeStorage("joinedAt"),
	achievements: getSafeJSON<UserAchievement[]>("achievements"),

	setAuth: (
		id,
		user,
		avatar = null,
		isGuest = false,
		role = "user",
		socialAccounts = null,
		joinedAt = null,
		achievements = null,
	) => {
		if (typeof window !== "undefined") {
			localStorage.setItem("userId", String(id));
			localStorage.setItem("user", user);

			if (avatar) localStorage.setItem("avatar", avatar);
			else localStorage.removeItem("avatar");

			localStorage.setItem("isGuest", String(isGuest));
			localStorage.setItem("role", role ?? "user");

			if (socialAccounts)
				localStorage.setItem("socialAccounts", JSON.stringify(socialAccounts));
			else localStorage.removeItem("socialAccounts");

			if (joinedAt) localStorage.setItem("joinedAt", joinedAt);
			else localStorage.removeItem("joinedAt");

			if (achievements)
				localStorage.setItem("achievements", JSON.stringify(achievements));
			else localStorage.removeItem("achievements");
		}
		set({
			id,
			user,
			avatar,
			isGuest,
			role,
			socialAccounts,
			joinedAt,
			achievements,
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
			localStorage.removeItem("isGuest");
			localStorage.removeItem("role");
			localStorage.removeItem("socialAccounts");
			localStorage.removeItem("joinedAt");
			localStorage.removeItem("achievements");
		}
		set({
			id: null,
			user: null,
			avatar: null,
			isGuest: false,
			role: null,
			socialAccounts: null,
			joinedAt: null,
			achievements: null,
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
			event.key === "isGuest" ||
			event.key === "role" ||
			event.key === "socialAccounts" ||
			event.key === "joinedAt" ||
			event.key === "achievements"
		) {
			useAuthStore.setState({
				user: getSafeStorage("user"),
				avatar: getSafeStorage("avatar"),
				isGuest: getSafeStorage("isGuest") === "true",
				role: getSafeStorage("role"),
				socialAccounts: getSafeJSON<SocialAccountInfo[]>("socialAccounts"),
				joinedAt: getSafeStorage("joinedAt"),
				achievements: getSafeJSON<UserAchievement[]>("achievements"),
			});
		}
	});
}
