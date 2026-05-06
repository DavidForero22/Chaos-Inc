// src/hooks/profile/usePublicProfileData.ts

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios.ts";
import type { GameRecord, UserRecord } from "../../types/api.ts";

export function usePublicProfileData(userId: string | undefined) {
	const navigate = useNavigate();
	const [games, setGames] = useState<GameRecord[]>([]);
	const [profileUser, setProfileUser] = useState<UserRecord | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!userId) {
			navigate("/");
			return;
		}

		const fetchData = async () => {
			setLoading(true); // Resetear el loader al cambiar de usuario
			try {
				const [userRes, gamesRes] = await Promise.all([
					api.get(`/users/${userId}`, { hideLoader: true } as any),
					api.get(`/users/${userId}/games`, { hideLoader: true } as any),
				]);
				setProfileUser(userRes.data.data ?? userRes.data);
				setGames(gamesRes.data.data ?? gamesRes.data);
			} catch {
				navigate("/");
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [userId, navigate]);

	return { games, profileUser, loading };
}
