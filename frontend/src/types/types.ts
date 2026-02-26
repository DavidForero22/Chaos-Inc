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
}

/**
 * Tipado de mis datos privados
 */
export interface MyData {
	name: string;
	role: "boss" | "secretary" | "intern" | "union";
	stress: number;
	is_dead: boolean;
	cards: number[];
	skip_next_turn: boolean;
}

/**
 * Tipado general de la respuesta del sync
 */
export interface GameData {
	me: MyData;
	game: {
		current_turn: string;
		opponents: Opponent[];
	};
}
