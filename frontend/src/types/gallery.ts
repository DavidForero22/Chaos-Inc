import type { DisplayRole } from "../data/game/roles";
import { type ConfigKey as EndingKey } from "../data/game/gameResults.ts";

// Tipos de respuesta del backend
export interface GalleryCard {
	id: number;
	display_name: string;
	description: string | null;
	lore: string | null;
	image_path: string | null;
	type: string | null;
	is_discovered: boolean;
	times_played: number;
	category: string;
}

export interface GalleryResponse {
	cards: GalleryCard[];
	roles: DisplayRole[]; // ej: ["boss", "secretary", ...]
	endings: EndingKey[]; // ej: ["boss", "canceled", ...]
}

// Datos procesados para la UI
export interface EnrichedCard extends GalleryCard {
	unlockHint?: string;
}

export interface EnrichedRole {
	role: DisplayRole;
	label: string;
	image: string;
	unlockHint: string;
	isUnlocked: boolean;
	objective: string;
}

export interface EnrichedEnding {
	ending: EndingKey;
	name: string;
	image: string;
	unlockHint: string;
	isUnlocked: boolean;
	description: string;
}
