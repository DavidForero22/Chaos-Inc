// --- TIPOS DE LA SALA (Lobby / Room) ---
export interface RoomData {
	room_id: string;
	name: string;
	max_players: number;
	owner_name: string;
	status: string;
	players: string[];
	is_private?: string;
}

// --- TIPOS DEL JUEGO (Tablero) ---
export interface Opponent {
	name: string;
	stress: number;
	is_dead: boolean;
	role: "boss" | "hidden";
}

export interface MyData {
	name: string;
	role: "boss" | "secretary" | "intern" | "union";
	stress: number;
	is_dead: boolean;
	cards: number[];
}

export interface GameData {
	me: MyData;
	game: {
		current_turn: string;
		opponents: Opponent[];
	};
}
