import { useNotificationStore } from "../../store/useNotificationStore";
import type { NotificationType } from "../../store/useNotificationStore";
import { useGameStore } from "../../store/useGameStore";
import { useAuth } from "../useAuth";

// Objetivo de la carta
type TargetScope = "single" | "all" | "opponents" | "self";

const CARD_DICT: Record<
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
};

export function useGameEventParser() {
	const { id: myId } = useAuth();

	const addNotification = useNotificationStore(
		(state) => state.addNotification,
	);
	const addLog = useNotificationStore((state) => state.addLog);

	const parseAndNotify = (
		cardId: number,
		sourceId: string,
		targetId?: string | null,
	) => {
		const state = useGameStore.getState();
		const me = state.gameData?.me;
		const opponents = state.gameData?.game?.opponents ?? [];

		const cardInfo = CARD_DICT[cardId];
		if (!cardInfo) return; // Si la carta no existe, ignorar

		/**
		 * Resolver ID a Nombre
		 */
		const resolveName = (id: string | null | undefined) => {
			if (!id) return "Alguien";
			if (String(id) === String(myId)) return me?.name;
			const opponent = opponents.find((o) => String(o.id) === String(id));
			return opponent ? opponent.name : `Empleado ${id}`;
		};

		const sourceName = resolveName(sourceId);
		const targetName = resolveName(targetId);

		let message = "";
		const isMeSource = String(sourceId) === String(myId);
		const isMeTarget = targetId ? String(targetId) === String(myId) : false;

		switch (cardInfo.type) {
			case "attack":
				if (cardInfo.scope === "opponents") {
					message = isMeSource
						? `Has usado ${cardInfo.name}`
						: `¡${sourceName} te ha atacado con ${cardInfo.name}!`;
				} else {
					if (isMeTarget) message = `¡${sourceName} te ha atacado!`;
					else if (isMeSource) message = `Has atacado a ${targetName}`;
					else message = `${sourceName} atacó a ${targetName}`;
				}
				break;

			case "heal":
				if (cardInfo.scope === "all") {
					message = isMeSource
						? `Has usado ${cardInfo.name} (Todos se curan)`
						: `${sourceName} usó ${cardInfo.name} (Todos se curan)`;
				} else {
					if (isMeSource) message = "Te has curado";
					else message = `${sourceName} se ha curado`;
				}
				break;

			case "perk":
				if (isMeSource) message = `Has equipado ${cardInfo.name}`;
				else message = `${sourceName} equipó ${cardInfo.name}`;
				break;

			case "default":
			default:
				if (cardInfo.scope === "all" || cardInfo.scope === "opponents") {
					message = isMeSource
						? `Has usado ${cardInfo.name}`
						: `${sourceName} usó ${cardInfo.name}`;
				} else {
					if (isMeTarget)
						message = `¡${sourceName} usó ${cardInfo.name} contra ti!`;
					else if (isMeSource)
						message = targetId
							? `Usaste ${cardInfo.name} en ${targetName}`
							: `Usaste ${cardInfo.name}`;
					else
						message = targetId
							? `${sourceName} usó ${cardInfo.name} en ${targetName}`
							: `${sourceName} usó ${cardInfo.name}`;
				}
				break;
		}

		addNotification({
			type: cardInfo.type,
			message: message,
			iconKey: cardInfo.icon,
		});

		addLog(message);
	};

	return { parseAndNotify };
}
