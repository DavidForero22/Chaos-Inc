// types/user.ts

/**
 * Tipado de un logro desbloqueado por el usuario
 */
export interface UserAchievement {
	id: string;
	unlockedAt: string;
}

export interface SocialAccountInfo {
	provider: string;
	avatar: string | null;
}

export interface FriendSummary {
	id: number;
	username: string;
	avatar: string | null;
	totalXp: number;
}

export interface FriendRequest {
	id: number;
	status: "pending" | "accepted";
	direction: "sent" | "received";
	createdAt: string;
	user: FriendSummary;
}

export interface UserRecord {
	id: number;
	username: string;
	email?: string;
	role: string;
	avatar: string | null;
	socialAccounts?: SocialAccountInfo[];
	isGuest: boolean;
	joinedAt: string;
	achievements?: UserAchievement[];
	totalXp?: number;
	friends?: FriendSummary[];
}
