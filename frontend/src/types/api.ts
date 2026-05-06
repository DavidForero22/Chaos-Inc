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

export interface GameParticipant {
	userId: number | null;
	isGuest: boolean;
	displayName: string;
	stats: {
		hasWon: boolean;
		role: string;
		damageDealt: number;
		damageReceived: number;
		cardsPlayed: number;
		eliminations: number;
	};
}

export interface GameRecord {
	id: number;
	winnerRole: string;
	totalRounds: number;
	totalEliminations: number;
	playedAt: string;
	players: GameParticipant[];
}

export interface UserRecord {
	id: number;
	username: string;
	email: string;
	role: string;
	avatar: string;
	providerAvatar: string;
	provider: string;
	isGuest: boolean;
	joinedAt: string;
}

export interface RoomRecord {
	room_id: string;
	name: string;
	status: string;
	owner_name: string;
	max_players: string;
	players: string[];
}
