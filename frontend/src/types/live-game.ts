// src/types/live-game.ts

/**
 * Roles disponibles en el juego
 */
export type PlayerRole = "boss" | "secretary" | "intern" | "union";
export type WinnerRole = "boss" | "union" | "intern" | null;

export interface PlayerConditions {
    has_shield: boolean;
    acting_boss: boolean;
    is_blocked: boolean;
    skip_next_turn: boolean;
}

export interface TurnLimits {
    single_attack_used: boolean;
    multi_attack_used: boolean;
}

export interface CombatState {
    is_defending_single: boolean;
    is_defending_multi: boolean;
    is_attacking_single: boolean;
    is_attacking_multi: boolean;
}

/**
 * Datos compartidos entre cualquier tipo de jugador (Tú o los Oponentes)
 */
export interface BasePlayer {
    name: string;
    stress: number;
    is_dead: boolean;
    is_online: boolean;
    conditions: Pick<PlayerConditions, 'has_shield' | 'acting_boss' | 'is_blocked'>;
}

/**
 * Tipado de los oponentes (Hereda de BasePlayer)
 */
export interface Opponent extends BasePlayer {
	role: "boss" | "hidden";
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
    conditions: PlayerConditions;
    turn_limits: TurnLimits;
    combat_state: CombatState;
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
