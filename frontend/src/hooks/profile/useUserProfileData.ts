// src/hooks/profile/useUserProfileData.ts

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios.ts";
import { useAuthStore } from "../../store/useAuthStore.ts";
import type { GameRecord, UserRecord } from "../../types/api.ts";

export function useUserProfileData(userId: string | undefined) {
	const navigate = useNavigate();
	const { id: myId, isGuest } = useAuthStore();

	const [games, setGames] = useState<GameRecord[]>([]);
	const [profileUser, setProfileUser] = useState<UserRecord | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		// Si no hay ID o el usuario actual es un invitado puro navegando, cortamos
		if (!userId || isGuest) {
			setLoading(false);
			return;
		}

		const fetchData = async () => {
			setLoading(true); // Resetear el loader al cambiar de usuario
			try {
				// Si visitamos nuestro propio ID, usamos /me/games. Si no, usamos el endpoint público.
				const gamesEndpoint =
					String(myId) === userId ? "/me/games" : `/users/${userId}/games`;

				const [userRes, gamesRes] = await Promise.all([
					api.get(`/users/${userId}`, { hideLoader: true } as any),
					api.get(gamesEndpoint, { hideLoader: true } as any),
				]);

				setProfileUser(userRes.data.data ?? userRes.data);
				setGames(gamesRes.data.data ?? gamesRes.data);
			} catch {
				navigate("/"); // Si el usuario no existe, sacarlo de ahí
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [userId, myId, isGuest, navigate]);

	return { games, profileUser, loading };
}
