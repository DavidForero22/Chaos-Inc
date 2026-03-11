// src/hooks/usePlayerIdentity.ts

import { useAuthStore } from "../store/useAuthStore";

export function usePlayerIdentity() {
	const { user, isGuest } = useAuthStore();

	return {
		myPlayerName: user,
		isGuest,
	};
}
