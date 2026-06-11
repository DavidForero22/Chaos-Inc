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
	setUsers: (users: LeaderboardUser[]) => void;
}

export const useLeaderboardStore = create<LeaderboardState>((set) => ({
	users: [],
	setUsers: (users) => set({ users }),
}));
