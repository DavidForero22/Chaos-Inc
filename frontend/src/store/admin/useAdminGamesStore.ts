import { create } from "zustand";
import type { GameRecord } from "../../types/api";

interface CachedGamesData {
	games: GameRecord[];
	totalPages: number;
	totalCount: number;
	timestamp: number;
}

interface AdminGamesStore {
	cache: Record<string, CachedGamesData>;
	setCache: (key: string, data: Omit<CachedGamesData, "timestamp">) => void;
}

export const useAdminGamesStore = create<AdminGamesStore>((set) => ({
	cache: {},
	setCache: (key, data) =>
		set((state) => ({
			cache: {
				...state.cache,
				[key]: {
					...data,
					timestamp: Date.now(),
				},
			},
		})),
}));
