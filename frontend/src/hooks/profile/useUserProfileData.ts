// src/hooks/profile/useUserProfileData.ts

import { useState, useEffect } from "react";
import api from "../../api/axios.ts";
import { useAuthStore } from "../../store/auth/useAuthStore.ts";
import type { GameRecord } from "../../types/api.ts";
import type { UserRecord } from "../../types/user.ts";

export function useUserProfileData(userId: string | undefined, refreshKey = 0) {
	const { id: myId, isGuest } = useAuthStore();

	const [games, setGames] = useState<GameRecord[]>([]);
	const [profileUser, setProfileUser] = useState<UserRecord | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		// Si no hay ID de perfil o no hay sesión activa, no pedir datos
		if (!userId || (!myId && !isGuest)) {
			setLoading(false);
			return;
		}

		const fetchData = async () => {
			setLoading(true);
			try {
				const gamesEndpoint =
					String(myId) === userId ? "/me/games" : `/users/${userId}/games`;

				const [userRes, gamesRes] = await Promise.all([
					api.get(`/users/${userId}`, { hideLoader: true } as any),
					api.get(gamesEndpoint, { hideLoader: true } as any),
				]);

				setProfileUser(userRes.data.data ?? userRes.data);
				setGames(gamesRes.data.data ?? gamesRes.data);
			} catch {
				// no-op
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [userId, myId, isGuest, refreshKey]);

	return { games, profileUser, loading };
}
