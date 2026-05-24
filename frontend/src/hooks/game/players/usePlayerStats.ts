import type { MyData } from "../../../types/live-game";
import { ROLE_CONFIG } from "../../../data/game/roles";
import { useDisplayPerks } from "./useDisplayPerks"; 

export function usePlayerStats(me: MyData) {
	const roleConfig = ROLE_CONFIG[me.role] || {
		color: "text-gray-400",
		label: "DESCONOCIDO",
	};

	const displayPerks = useDisplayPerks(me.perks);

	const hasAnyCondition = me.conditions.is_blocked || me.conditions.acting_boss;
	const myRange = me.perks.vision_range ?? 1;

	return { roleConfig, displayPerks, hasAnyCondition, myRange };
}
