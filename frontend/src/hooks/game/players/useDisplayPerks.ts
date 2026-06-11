import { useMemo } from "react";
import { PERKS_DICTIONARY } from "../../../data/game/perks";
import type { PlayerPerks } from "../../../types/live-game";

export interface PerkSlot {
	id: string;
	icon: string;
	title: string;
	isEmpty?: boolean;
	cardType?: number;
	name?: string;
	lore?: string;
}

export function useDisplayPerks(perks: PlayerPerks) {
	return useMemo(() => {
		const slots: PerkSlot[] = [];

		if (!perks) return slots;

		// Procesar perks booleanos
		Object.entries(PERKS_DICTIONARY).forEach(([key, config]) => {
			if (perks[key as keyof typeof perks]) {
				slots.push({ id: key, ...config });
			}
		});

		// Procesar perks con logica especifica
		if ((perks.vision_bonus ?? 0) > 0) {
			const vb = perks.vision_bonus;
			slots.push({
				id: "vision_bonus",
				icon: vb === 1 ? "👓" : "🔭",
				title: `Alcance visual +${vb}`,
				cardType: 10,
				name: "Catalejo",
				lore: "a",
			});
		}

		// Rellenar con huecos vacíos
		while (slots.length < 3) {
			slots.push({
				id: `empty-${slots.length}`,
				icon: "-",
				title: "Espacio de equipamiento libre",
				isEmpty: true,
			});
		}

		return slots;
	}, [perks]);
}
