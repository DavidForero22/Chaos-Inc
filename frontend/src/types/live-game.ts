// src/types/live-games.ts
// Interfaces de datos necesarios para las partidas en vivo

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
	acting_boss: boolean;
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
	acting_boss: boolean;
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
		round_number: number;
		deck_count: number;
		boss_disconnected: boolean;
		ending_soon: boolean;
	};
}
