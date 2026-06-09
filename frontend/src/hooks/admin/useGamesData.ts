import { useState, useCallback } from "react";
import api from "../../api/axios.ts";
import type { GameRecord } from "../../types/api.ts";
import { useAdminGamesStore } from "../../store/admin/useAdminGamesStore.ts";

export function useGamesData() {
	const cache = useAdminGamesStore((state) => state.cache);
	const setCache = useAdminGamesStore((state) => state.setCache);

	const [games, setGames] = useState<GameRecord[]>([]);
	const [loading, setLoading] = useState(true);

	const [totalPages, setTotalPages] = useState(1);
	const [totalCount, setTotalCount] = useState(0);

	const fetchGames = useCallback(
		async (
			page: number = 1,
			winner: string = "all",
			players: number | "all" = "all",
			sortField: string = "createdAt",
			sortDir: "asc" | "desc" = "desc",
			forceRefresh: boolean = false,
		) => {
			// Generar una clave única para esta combinación exacta de parámetros
			const cacheKey = `${page}-${winner}-${players}-${sortField}-${sortDir}`;
			const cachedData = cache[cacheKey];

			// Comprobar si la caché existe y tiene menos de 5 minutos (300,000 ms)
			const isCacheValid =
				cachedData && Date.now() - cachedData.timestamp < 300000;

			if (!forceRefresh && isCacheValid) {
				setGames(cachedData.games);
				setTotalPages(cachedData.totalPages);
				setTotalCount(cachedData.totalCount);
				setLoading(false);
				return;
			}

			setLoading(true);
			try {
				const params = new URLSearchParams({
					page: page.toString(),
					winner: winner,
					players: players.toString(),
					sortField: sortField,
					sortDir: sortDir,
				});

				const res = await api.get(`/games?${params.toString()}`, {
					hideLoader: true,
				} as any);

				const newData = {
					games: res.data.data,
					totalPages: res.data.meta.last_page,
					totalCount: res.data.meta.total,
				};

				setGames(newData.games);
				setTotalPages(newData.totalPages);
				setTotalCount(newData.totalCount);

				// Guardar en el store
				setCache(cacheKey, newData);
			} catch (error) {
				console.error("Error al cargar juegos:", error);
			} finally {
				setLoading(false);
			}
		},
		[cache, setCache],
	);

	return {
		games,
		loading,
		fetchGames,
		totalPages,
		totalCount,
	};
}
