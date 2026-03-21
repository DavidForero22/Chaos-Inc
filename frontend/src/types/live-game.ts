// src/types/live-game.ts

/**
 * Roles disponibles en el juego
 */
export type PlayerRole = "boss" | "secretary" | "intern" | "union";
export type WinnerRole = "boss" | "union" | "intern" | null;

/**
 * Datos compartidos entre cualquier tipo de jugador (Tú o los Oponentes)
 */
export interface BasePlayer {
	name: string;
	stress: number;
	is_dead: boolean;
	has_shield: boolean;
	acting_boss: boolean;
	is_blocked: boolean;
}

/**
 * Tipado de los oponentes (Hereda de BasePlayer)
 */
export interface Opponent extends BasePlayer {
	role: "boss" | "hidden";
	is_online: boolean;
	cards_count: number;
}

/**
 * Tipado de una carta individual
 */
export interface CardInstance {
	id: string;
	type: number;
	name: string;
	description: string;
}

/**
 * Tipado de mis datos privados (Hereda de BasePlayer)
 */
export interface MyData extends BasePlayer {
	role: PlayerRole;
	cards: CardInstance[];
	skip_next_turn: boolean;
	attack_used_this_turn: boolean;
	incoming_attack: boolean;
	has_pending_attack: boolean;
	has_pending_multi_attack: boolean;
	luck_challenge: string[] | null;
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
		winner_role: WinnerRole;
		round_number: number;
		deck_count: number;
		boss_disconnected: boolean;
		acting_boss_disconnected: boolean;
		ending_soon: boolean;
		has_acting_boss: boolean;
		effectively_over: boolean;
	};
}
