// src/hooks/profile/useProfileData.ts
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios.ts";
import { useAuthStore } from "../../store/useAuthStore.ts";
import type { GameRecord, UserRecord } from "../../types/api.ts";

export function useProfileData() {
	const { user, isGuest, logout, id } = useAuthStore();
	const navigate = useNavigate();

	const [games, setGames] = useState<GameRecord[]>([]);
	const [profileUser, setProfileUser] = useState<UserRecord | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!user) {
			navigate("/");
			return;
		}

		if (isGuest) {
			setLoading(false);
			return;
		}

		const fetchData = async () => {
			try {
				const [userRes, gamesRes] = await Promise.all([
					api.get(`/users/${id}`, { hideLoader: true } as any),
					api.get("/me/games", { hideLoader: true } as any),
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
	}, [user, isGuest, id]);

	const handleLogout = async () => {
		try {
			await api.post("/logout");
		} catch {}
		logout();
		navigate("/");
	};

	const handleDeleteAccount = async () => {
		if (!id) return;
		try {
			await api.delete(`/users/${id}`);
			logout();
			navigate("/");
		} catch (e: any) {
			alert(e.response?.data?.message || "Error al eliminar la cuenta.");
		}
	};

	return {
		games,
		profileUser,
		loading,
		handleLogout,
		handleDeleteAccount,
	};
}
