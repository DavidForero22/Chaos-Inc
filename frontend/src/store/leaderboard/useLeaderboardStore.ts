import { create } from "zustand";

export interface LeaderboardUser {
	id: number;
	avatar: string | null;
	username: string;
	level: number;
	total_xp: number;
}

interface LeaderboardState {
	users: LeaderboardUser[];
	lastFetched: number | null;
	setUsers: (users: LeaderboardUser[]) => void;
}

export const useLeaderboardStore = create<LeaderboardState>((set) => ({
	users: [],
	lastFetched: null,
	setUsers: (users) => set({ users, lastFetched: Date.now() }),
}));
