// src/hooks/profile/useProfileData.ts
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios.ts";
import { useAuthStore } from "../../store/useAuthStore.ts";
import type { GameRecord } from "../../types/api.ts";

export function useProfileData() {
	const { token, isGuest, logout } = useAuthStore();
	const navigate = useNavigate();

	const [games, setGames] = useState<GameRecord[]>([]);
	const [loading, setLoading] = useState(true);
	const [meId, setMeId] = useState<number | null>(null);

	useEffect(() => {
		if (!token) {
			navigate("/");
			return;
		}

		if (isGuest) {
			setLoading(false);
			return;
		}

		const fetchData = async () => {
			try {
				const [meRes, gamesRes] = await Promise.all([
					api.get("/me"),
					api.get("/me/games"),
				]);
				setMeId(meRes.data.id);
				setGames(gamesRes.data.data ?? gamesRes.data);
			} catch {
				navigate("/");
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [token, isGuest, navigate]);

	const handleLogout = async () => {
		try {
			await api.post("/logout");
		} catch {}
		logout();
		navigate("/");
	};

	const handleDeleteAccount = async () => {
		if (!meId) return;
		try {
			await api.delete(`/users/${meId}`);
			logout();
			navigate("/");
		} catch (e: any) {
			alert(e.response?.data?.message || "Error al eliminar la cuenta.");
		}
	};

	return {
		games,
		loading,
		handleLogout,
		handleDeleteAccount,
	};
}
