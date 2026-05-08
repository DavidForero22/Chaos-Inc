// src/types/api.ts
// Interfaces de los datos que devuelve API Rest

/**
 * Tipado de la sala
 */
export interface RoomData {
	room_id: string;
	name: string;
	max_players: number;
	owner_name: string;
	status: string;
	players: string[];
	is_private?: string;
}

/**
 * Tipado para el uso de cartas
 */
export interface CardUsage {
	cardId: number;
	timesPlayed: number;
}

export interface GameParticipant {
	userId: number | null;
	isGuest: boolean;
	displayName: string;
	stats: {
		hasWon: boolean;
		role: string;
		isDead: boolean;
		damageDealt: number;
		damageReceived: number;
		healingDone: number;
		cardsPlayed: number;
		passivesPlayed: number;
		eliminations: number;
		dodgedAttacks: number;
		cardsStolen: number;
	};
	cardUsages?: CardUsage[];
}

export interface GameRecord {
	id: number;
	winnerRole: string;
	totalRounds: number;
	totalEliminations: number;
	playedAt: string;
	players: GameParticipant[];
}

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

export interface UserRecord {
	id: number;
	username: string;
	email: string;
	role: string;
	avatar: string | null;
	socialAccounts?: SocialAccountInfo[];
	isGuest: boolean;
	joinedAt: string;
	achievements?: UserAchievement[];
}

export interface RoomRecord {
	room_id: string;
	name: string;
	status: string;
	owner_name: string;
	max_players: string;
	players: string[];
}
