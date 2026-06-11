import { useState, useEffect } from "react";
import { useLeaderboardStore } from "../../store/leaderboard/useLeaderboardStore";
import { useToastStore } from "../../store/ui/useToastStore";
import api from "../../api/axios";

export function useLeaderboard() {
	const { users, setUsers } = useLeaderboardStore();
	const [isLoading, setIsLoading] = useState(false);
	const showToast = useToastStore((state) => state.showToast);

	useEffect(() => {
		const fetchLeaderboard = async () => {
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
	}, [setUsers, showToast]);

	return { users, isLoading };
}
