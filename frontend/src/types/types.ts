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
 * Tipado de los oponentes
 */
export interface Opponent {
	name: string;
	stress: number;
	is_dead: boolean;
	role: "boss" | "hidden";
	is_online: boolean;
	cards_count: number;
	has_shield: boolean;
}

/**
 * Tipado de mis datos privados
 */
export interface CardInstance {
	id: string;
	type: number;
	name: string;
	description: string;
}

export interface MyData {
	name: string;
	role: "boss" | "secretary" | "intern" | "union";
	stress: number;
	is_dead: boolean;
	cards: CardInstance[];
	skip_next_turn: boolean;
	attack_used_this_turn: boolean;
	incoming_attack: boolean;
	has_shield: boolean;
	has_pending_attack: boolean;
}

/**
 * Tipado general de la respuesta del sync
 */
export interface GameData {
	me: MyData;
	game: {
		current_turn: string;
		opponents: Opponent[];
		game_over: boolean;
		winner_role: "boss" | "union" | "intern" | null;
	};
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
