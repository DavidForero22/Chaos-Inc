// frontend/src/hooks/game/useOpponentPerks.ts
import { useMemo } from "react";
import type { Opponent } from "../../types/live-game";

export interface OpponentPerkSlot {
	id: string;
	icon: string;
	title: string;
	isEmpty?: boolean;
	cardType?: number;
	name?: string;
}

export function useOpponentPerks(player: Opponent) {
	return useMemo(() => {
		const list: OpponentPerkSlot[] = [];

		// Recopilar todos los perks activos del oponente
		if (player.perks?.has_shield) {
			list.push({
				id: "has_shield",
				icon: "🛡️",
				title: "Escudo Activo",
				cardType: 5,
				name: "Escudo",
			});
		}
		if ((player.perks?.vision_bonus ?? 0) > 0) {
			const vb = player.perks.vision_bonus;
			list.push({
				id: "vision_bonus",
				icon: vb === 1 ? "👓" : "🔭",
				title: `Ve a +${vb} de alcance`,
				cardType: 10,
				name: "Visión",
			});
		}
		if ((player.perks?.distance_bonus ?? 0) > 0) {
			list.push({
				id: "distance_bonus",
				icon: "🏠",
				title: "Está a +1 de distancia",
				cardType: 11,
				name: "Lejanía",
			});
		}
		if (player.perks?.has_storage) {
			list.push({
				id: "has_storage",
				icon: "💼",
				title: "Límite de cartas en mano +1",
				cardType: 13,
				name: "Almacén",
			});
		}
		if (player.perks?.has_luck) {
			list.push({
				id: "has_luck",
				icon: "🍀",
				title: "50% de que robe una carta más al iniciar el turno",
				cardType: 14,
				name: "Suerte",
			});
		}

		// Rellenar con huecos vacíos hasta tener exactamente 3
		const slots: OpponentPerkSlot[] = [...list];
		while (slots.length < 3) {
			slots.push({
				id: `empty-${slots.length}`,
				icon: "-",
				title: "Espacio de equipamiento libre",
				isEmpty: true,
			});
		}

		return slots;
	}, [player.perks]);
}
