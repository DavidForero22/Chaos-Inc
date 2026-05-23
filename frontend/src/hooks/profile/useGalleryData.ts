// src/hooks/useGalleryData.ts

import { useEffect, useState } from "react";
import api from "../../api/axios";
import { ROLE_CONFIG, type DisplayRole } from "../../data/roles";
import {
	RESULT_CONFIG,
	type ConfigKey as EndingKey,
} from "../../data/gameResults";

// Tipos de respuesta del backend
export interface GalleryCard {
	id: number;
	display_name: string;
	description: string | null;
	lore: string | null;
	image: string | null;
	type: string | null;
	is_discovered: boolean;
	times_played: number;
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

export function useGalleryData() {
	const [cards, setCards] = useState<EnrichedCard[]>([]);
	const [roles, setRoles] = useState<EnrichedRole[]>([]);
	const [endings, setEndings] = useState<EnrichedEnding[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchGallery = async () => {
			try {
				setLoading(true);
				const res = await api.get("/gallery", { hideLoader: true } as any);

				const responseData = res.data.data || res.data;
				const {
					cards: rawCards,
					roles: rawRoles,
					endings: rawEndings,
				} = responseData;

				console.log("Raw cards:", rawCards);
				console.log("Raw roles:", rawRoles);
				console.log("Raw endings:", rawEndings);

				const enrichedCards: EnrichedCard[] = rawCards.map(
					(card: GalleryCard) => ({
						...card,
						unlockHint: card.is_discovered
							? undefined
							: "Juega una partida y ten esta carta en tu mano para descubrirla.",
					}),
				);

				// Enriquecer roles
				const allRoles: DisplayRole[] = [
					"boss",
					"secretary",
					"intern",
					"union",
				];
				const enrichedRoles: EnrichedRole[] = allRoles.map((role) => {
					const config = ROLE_CONFIG[role];
					return {
						role,
						label: config.label,
						image: config.image,
						unlockHint: config.unlockHint,
						isUnlocked: rawRoles?.includes(role) ?? false,
						objective: config.objective,
					};
				});

				// Enriquecer finales
				const allEndings: EndingKey[] = ["boss", "union", "intern", "canceled"];
				const enrichedEndings: EnrichedEnding[] = allEndings.map((ending) => {
					const config = RESULT_CONFIG[ending];
					return {
						ending,
						name: config.name,
						image: config.image,
						unlockHint: config.unlockHint,
						isUnlocked: rawEndings?.includes(ending) ?? false,
						description: config.description,
					};
				});

				setCards(enrichedCards);
				setRoles(enrichedRoles);
				setEndings(enrichedEndings);
			} catch (err: any) {
				setError(err.response?.data?.message || "Error al cargar la galería");
				console.error("Gallery error:", err);
			} finally {
				setLoading(false);
			}
		};

		fetchGallery();
	}, []);

	return { cards, roles, endings, loading, error };
}
