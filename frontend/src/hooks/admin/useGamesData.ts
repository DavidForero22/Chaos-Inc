// src/hooks/admin/useGamesData.ts

import { useState, useCallback } from "react";
import api from "../../api/axios.ts";
import type { GameRecord } from "../../types/api.ts";

export function useGamesData() {
	const [games, setGames] = useState<GameRecord[]>([]);
	const [loading, setLoading] = useState(true);

	const [totalPages, setTotalPages] = useState(1);
	const [totalCount, setTotalCount] = useState(0);

	const fetchGames = useCallback(
		async (
			page: number = 1,
			winner: string = "all",
			players: number | "all" = "all",
			sort: "asc" | "desc" = "desc",
		) => {
			setLoading(true);
			try {
				// Construir URL con los parámetros
				const params = new URLSearchParams({
					page: page.toString(),
					winner: winner,
					players: players.toString(),
					sort: sort,
				});

				const res = await api.get(`/games?${params.toString()}`, {
					hideLoader: true,
				} as any);

				setGames(res.data.data);
				setTotalPages(res.data.meta.last_page);
				setTotalCount(res.data.meta.total);
			} catch (error) {
				console.error("Error fetching games:", error);
			} finally {
				setLoading(false);
			}
		},
		[],
	);

	return {
		games,
		loading,
		fetchGames,
		totalPages,
		totalCount,
	};
}
