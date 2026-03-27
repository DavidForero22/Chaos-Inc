// frontend/src/hooks/game/usePlayerStats.ts
import { useMemo } from "react";
import type { MyData } from "../../types/live-game";

/**
 * Casilla de cartas pasivas
 */
export interface PerkSlot {
	id: string;
	icon: string;
	title: string;
	isEmpty?: boolean;
	cardType?: number;
	name?: string;
}

export function usePlayerStats(me: MyData) {
	const roleConfig = {
		boss: { color: "text-yellow-400", label: "👑 JEFE" },
		secretary: { color: "text-blue-400", label: "📋 SECRETARIO" },
		intern: { color: "text-green-400", label: "🎓 BECARIO" },
		union: { color: "text-red-400", label: "✊ SINDICALISTA" },
	}[me.role] || { color: "text-gray-400", label: "❓ DESCONOCIDO" };

	const displayPerks = useMemo(() => {
		const list: PerkSlot[] = [];
		if (me.perks.has_shield) {
			list.push({
				id: "has_shield",
				icon: "🛡️",
				title: "Escudo Activo",
				cardType: 5,
				name: "Escudo"
			});
		}
		if ((me.perks.vision_bonus ?? 0) > 0) {
			const vb = me.perks.vision_bonus;
			list.push({
				id: "vision_bonus",
				icon: vb === 1 ? "👓" : "🔭",
				title: `Ves a +${vb} de alcance`,
				cardType: 10,
				name:"Vision"
			});
		}
		if ((me.perks.distance_bonus ?? 0) > 0) {
			list.push({
				id: "distance_bonus",
				icon: "🏠",
				title: "Los demás te ven a +1 de alcance",
				cardType: 11,
				name:"Lejania"
			});
		}
		if (me.perks.has_storage) {
			list.push({
				id: "has_storage",
				icon: "📦",
				title: "Límite de cartas en mano +1",
				cardType: 13,
				name:"Almacen"
			});
		}
		if (me.perks.has_luck) {
			list.push({
				id: "has_luck",
				icon: "🍀",
				title: "50% de tomar una carta extra al inicio del turno.",
				cardType: 14,
				name: "Almacen"
			});
		}

		// Rellenar con huecos vacios
		const slots: PerkSlot[] = [...list];
		while (slots.length < 3) {
			slots.push({
				id: `empty-${slots.length}`,
				icon: "-",
				title: "Espacio de equipamiento libre",
				isEmpty: true,
			});
		}

		return slots;
	}, [me.perks]);

	const hasAnyCondition = me.conditions.is_blocked || me.conditions.acting_boss;
	const myRange = me.perks.vision_range ?? 1;

	return { roleConfig, displayPerks, hasAnyCondition, myRange };
}
