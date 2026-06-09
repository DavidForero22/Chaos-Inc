import { create } from "zustand";
import type { UserRecord } from "../../types/user";

interface CachedUsersData {
	users: UserRecord[];
	totalPages: number;
	totalCount: number;
	timestamp: number;
}

interface AdminUsersStore {
	cache: Record<string, CachedUsersData>;
	setCache: (key: string, data: Omit<CachedUsersData, "timestamp">) => void;
	invalidateCache: () => void;
}

export const useAdminUsersStore = create<AdminUsersStore>((set) => ({
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
	invalidateCache: () => set({ cache: {} }),
}));
