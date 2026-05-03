import { useNotificationStore } from "../../store/useNotificationStore";
import type { NotificationType } from "../../store/useNotificationStore";
import { useGameStore } from "../../store/useGameStore";

// Pequeño diccionario basado en tu base de datos PHP
const CARD_DICT: Record<
	number,
	{ type: NotificationType; name: string; icon: string }
> = {
	1: { type: "attack", name: "Ataque", icon: "attack" },
	2: { type: "heal", name: "Té", icon: "heal" },
	3: { type: "default", name: "Evasión", icon: "dodge" },
	4: { type: "default", name: "Robo", icon: "steal" },
	5: { type: "perk", name: "Escudo", icon: "perk" },
	6: { type: "default", name: "Laxante", icon: "block" },
	7: { type: "attack", name: "Inspección Sorpresa", icon: "all" },
	8: { type: "heal", name: "Viernes de Cañas", icon: "all" },
	9: { type: "default", name: "Sabotaje", icon: "discard" },
	10: { type: "perk", name: "Catalejo", icon: "perk" },
	11: { type: "perk", name: "Teletrabajo", icon: "perk" },
	12: { type: "default", name: "Recorte", icon: "discard" },
	13: { type: "perk", name: "Riñonera", icon: "perk" },
	14: { type: "perk", name: "Suerte", icon: "perk" },
};

export function useGameEventParser() {
	const addNotification = useNotificationStore(
		(state) => state.addNotification,
	);
	const addLog = useNotificationStore((state) => state.addLog);
	const parseAndNotify = (
		cardId: number,
		sourceName: string,
		targetName?: string | null,
	) => {
		const myPlayerName = useGameStore.getState().gameData?.me?.name;
		const cardInfo = CARD_DICT[cardId];
		if (!cardInfo) return; // Si la carta no existe, ignoramos

		let message = "";
		const isMeSource = sourceName === myPlayerName;
		const isMeTarget = targetName === myPlayerName;

		switch (cardInfo.type) {
			case "attack":
				if (isMeTarget) message = `¡${sourceName} te ha atacado!`;
				else if (isMeSource)
					message = targetName
						? `Has atacado a ${targetName}`
						: "Has lanzado un ataque masivo";
				else
					message = targetName
						? `${sourceName} atacó a ${targetName}`
						: `${sourceName} lanzó un ataque masivo`;
				break;

			case "heal":
				if (isMeSource) message = "Te has curado";
				else message = `${sourceName} se ha curado`;
				break;

			case "perk":
				if (isMeSource) message = `Has equipado ${cardInfo.name}`;
				else message = `${sourceName} equipó ${cardInfo.name}`;
				break;

			case "default":
			default:
				if (isMeTarget)
					message = `¡${sourceName} usó ${cardInfo.name} contra ti!`;
				else if (isMeSource)
					message = targetName
						? `Usaste ${cardInfo.name} en ${targetName}`
						: `Usaste ${cardInfo.name}`;
				else
					message = targetName
						? `${sourceName} usó ${cardInfo.name} en ${targetName}`
						: `${sourceName} usó ${cardInfo.name}`;
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
