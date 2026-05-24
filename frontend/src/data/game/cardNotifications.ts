import type { NotificationType } from "../../store/ui/useNotificationStore";

export type TargetScope = "single" | "all" | "opponents" | "self";

export const CARD_NOTIFICATION_DICT: Record<
	number,
	{ type: NotificationType; name: string; icon: string; scope: TargetScope }
> = {
	1: { type: "attack", name: "Ataque", icon: "attack", scope: "single" },
	2: { type: "heal", name: "Té", icon: "heal", scope: "self" },
	3: { type: "default", name: "Evasión", icon: "dodge", scope: "self" },
	4: { type: "default", name: "Robo", icon: "steal", scope: "single" },
	5: { type: "perk", name: "Escudo", icon: "perk", scope: "self" },
	6: { type: "default", name: "Laxante", icon: "block", scope: "single" },
	7: {
		type: "attack",
		name: "Inspección Sorpresa",
		icon: "all",
		scope: "opponents",
	},
	8: { type: "heal", name: "Viernes de Cañas", icon: "all", scope: "all" },
	9: { type: "default", name: "Sabotaje", icon: "discard", scope: "single" },
	10: { type: "perk", name: "Catalejo", icon: "perk", scope: "self" },
	11: { type: "perk", name: "Teletrabajo", icon: "perk", scope: "self" },
	12: { type: "default", name: "Recorte", icon: "discard", scope: "single" },
	13: { type: "perk", name: "Riñonera", icon: "perk", scope: "self" },
	14: { type: "perk", name: "Suerte", icon: "perk", scope: "self" },
	15: { type: "default", name: "Monos Locos", icon: "steal", scope: "opponents" },
	16: { type: "perk", name: "Lanzapatatas 3000", icon: "perk", scope: "self" },
	17: { type: "heal", name: "Resurrección", icon: "heal", scope: "single" },
};
