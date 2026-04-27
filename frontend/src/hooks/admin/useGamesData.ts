// src/hooks/admin/useGamesData.ts

import { useState, useCallback } from "react";
import api from "../../api/axios.ts";
import type { GameRecord } from "../../types/api.ts";

export function useGamesData() {
	const [games, setGames] = useState<GameRecord[]>([]);
	const [loading, setLoading] = useState(true);

	const fetchGames = useCallback(async () => {
		setLoading(true);
		try {
			const res = await api.get("/games", { hideLoader: true } as any);
			setGames(res.data.data ?? res.data);
		} finally {
			setLoading(false);
		}
		
	}, []);

	return {
		games,
		loading,
		fetchGames,
	};
}
