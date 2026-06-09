import { useState, useEffect, useCallback } from "react";
import api from "../../api/axios";
import { useAnalyticsStore } from "../../store/admin/useAnalyticsStore";

export interface WinRateData {
	boss: number;
	secretary: number;
	intern: number;
	union: number;
	canceled: number;
}

export interface TopCard {
	id: number;
	name: string;
	total: number;
}

export interface GrowthPoint {
	date: string; // YYYY-MM-DD
	registered: number;
	guests: number;
}

export interface SocialAuthData {
	google: number;
	discord: number;
	email: number;
}

export interface HeatmapData {
	data: number[][]; // 7x24 matrix
	max: number;
}

export interface AnalyticsDashboardData {
	win_rate: WinRateData;
	top_cards: TopCard[];
	user_growth: GrowthPoint[];
	social_auth: SocialAuthData;
}

interface UseAnalyticsDashboardReturn {
	data: AnalyticsDashboardData | null;
	loading: boolean;
	error: string | null;
	refresh: () => Promise<void>; // Lo hacemos promesa para que el botón sepa cuándo termina
	days: number;
	setDays: (days: number) => void;
}

export function useAnalyticsDashboard(
	initialDays: number = 30,
): UseAnalyticsDashboardReturn {
	// Conectamos el Store
	const cache = useAnalyticsStore((state) => state.cache);
	const setCache = useAnalyticsStore((state) => state.setCache);

	const [data, setData] = useState<AnalyticsDashboardData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [days, setDays] = useState(initialDays);

	const fetchData = useCallback(
		async (forceRefresh: boolean = false) => {
			// Comprobar caché (TTL: 5 minutos = 300,000 ms)
			const cachedData = cache[days];
			const isCacheValid =
				cachedData && Date.now() - cachedData.timestamp < 300000;

			if (!forceRefresh && isCacheValid) {
				setData(cachedData.data);
				setLoading(false);
				return;
			}

			// Si no hay caché o fuerza recarga, ir al servidor
			setLoading(true);
			setError(null);
			try {
				const response = await api.get(`/analytics?days=${days}`, {
					hideLoader: true,
				} as any);

				setData(response.data);
				setCache(days, response.data);
			} catch (err: any) {
				setError(
					err.response?.data?.message || "Error al cargar las analíticas",
				);
				console.error("Analytics fetch error:", err);
			} finally {
				setLoading(false);
			}
		},
		[days, cache, setCache],
	);

	const refresh = useCallback(async () => {
		await fetchData(true);
	}, [fetchData]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	return { data, loading, error, refresh, days, setDays };
}
