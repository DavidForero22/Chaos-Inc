import { create } from "zustand";
import type { AnalyticsDashboardData } from "../../hooks/admin/useAnalyticsDashboard";

// Interfaz para saber cuándo guardamos los datos (para invalidar la caché si pasa mucho tiempo)
interface CachedAnalytics {
	data: AnalyticsDashboardData;
	timestamp: number;
}

interface AnalyticsStore {
	cache: Record<number, CachedAnalytics>;
	setCache: (days: number, data: AnalyticsDashboardData) => void;
}

export const useAnalyticsStore = create<AnalyticsStore>((set) => ({
	cache: {},
	setCache: (days, data) =>
		set((state) => ({
			cache: {
				...state.cache,
				[days]: {
					data,
					timestamp: Date.now(),
				},
			},
		})),
}));
