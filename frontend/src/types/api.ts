// src/types/api.ts
// Interfaces de los datos que devuelve API Rest

export interface RoomPlayer {
	id: string;
	name: string;
	avatar?: string | null;
	level: number;
}

/**
 * Tipado de la sala
 */
export interface RoomData {
	room_id: string;
	name: string;
	max_players: number;
	turn_timeout: number;
	owner_id: string;
	owner_name: string;
	status: "waiting" | "in_game";
	players: RoomPlayer[];
	is_private: boolean;
	is_debug: boolean;
}

/**
 * Tipado para el uso de cartas
 */
export interface CardUsage {
	cardId: number;
	name: string;
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

export interface CardCatalogItem {
	id: number;
	type: string;
	target: string;
	base_name: string;
	display_name: string;
	description: string;
	lore: string;
	icons: string[];
	image_url: string | null;
}
