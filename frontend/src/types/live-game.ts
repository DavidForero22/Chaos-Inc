// src/types/live-game.ts

/**
 * Roles disponibles en el juego
 */
export type PlayerRole = "boss" | "secretary" | "intern" | "union";
export type WinnerRole = "boss" | "union" | "intern" | null;

/**
 * Estados mecánicos / temporales
 */
export interface PlayerConditions {
	acting_boss: boolean;
	is_blocked: boolean;
	skip_next_turn: boolean;
	must_discard: boolean;
}

/**
 * Beneficios corporativos / Equipamiento (Cartas pasivas)
 */
export interface PlayerPerks {
	has_shield: boolean;
	vision_range: number;
	vision_bonus: number;
	has_distance: boolean;
	has_storage: boolean;
	has_luck: boolean;
	chaotic_passive: boolean;
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
	id: string;
	name: string;
	role: PlayerRole;
	avatar?: string | null;
	stress: number;
	max_stress: number;
	is_dead: boolean;
	killer_name?: string | null;
	is_online: boolean;
	conditions: Pick<PlayerConditions, "acting_boss" | "is_blocked">;
	perks: PlayerPerks;
}

/**
 * Tipado de los oponentes (Hereda de BasePlayer)
 */
export interface Opponent extends BasePlayer {
	cards_count: number;
	distance: number;
	is_in_range: boolean;
}

/**
 * Tipos de iconos disponibles enviados por el backend
 */
export type CardIconType =
	| "self"
	| "opponent"
	| "opponents"
	| "all"
	| "attack"
	| "heal"
	| "dodge"
	| "block"
	| "steal"
	| "discard"
	| "perk";

/**
 * Tipado de una carta individual en la mano del jugador
 */
export interface CardInstance {
	id: string; // El identificador único de esta instancia (ej: "uuid-1234")
	card_id: number; // El ID de la base de la carta (ej: 1)
	type: "attack" | "heal" | "default" | "perk";
	target: "self" | "opponent" | "opponents" | "all" | "none";
	base_name: string; // Nombre mecánico (ej: "Atacar")
	name: string; // Nombre de la variante (ej: "Café Derramado")
	description: string;
	lore: string;
	image?: string;
	icons: CardIconType[];
	category: "normal" | "chaotic";
}

/**
 * Tipado de mis datos privados (Hereda de BasePlayer)
 */
export interface MyData extends BasePlayer {
	cards: CardInstance[];
	max_hand_size: number;
	conditions: PlayerConditions;
	turn_limits: TurnLimits;
	combat_state: CombatState;
	luck_challenge: string[] | null;
	range?: number;
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

		pending_single_attack_target: string | null;
		pending_multi_attack_targets: string[];
		player_in_luck_challenge: string | null;
		player_pending_sabotage: string | null;

		turn_timeout: number;
		turn_expires_at: number;
		turn_remaining: number;
	};
}
