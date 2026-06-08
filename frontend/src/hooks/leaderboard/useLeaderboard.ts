import { useState, useEffect } from "react";
import { useLeaderboardStore } from "../../store/leaderboard/useLeaderboardStore";
import { useToastStore } from "../../store/ui/useToastStore";
import api from "../../api/axios";

export function useLeaderboard() {
	const { users, lastFetched, setUsers } = useLeaderboardStore();
	const [isLoading, setIsLoading] = useState(false);
	const showToast = useToastStore((state) => state.showToast);

	useEffect(() => {
		const fetchLeaderboard = async () => {
			// Caché de 5 minutos (300000 ms)
			if (
				users.length > 0 &&
				lastFetched &&
				Date.now() - lastFetched < 300000
			) {
				return;
			}

			setIsLoading(true);

			try {
				const response = await api.get(`/leaderboard`, {
					hideLoader: true,
				} as any);
				setUsers(response.data);
			} catch (err: any) {
				console.error("Error cargando la clasificación:", err);
				showToast(
					"No se ha podido cargar la clasificación en este momento.",
					"danger",
				);
			} finally {
				setIsLoading(false);
			}
		};

		fetchLeaderboard();
	}, [users.length, lastFetched, setUsers, showToast]);

	return { users, isLoading };
}
