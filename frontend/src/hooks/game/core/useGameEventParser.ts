import { useNotificationStore } from "../../../store/ui/useNotificationStore";
import { useGameStore } from "../../../store/game/useGameStore";
import { useAuth } from "../../auth/useAuth";
import { CARD_NOTIFICATION_DICT } from "../../../data/game/cardNotifications";

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

		const cardInfo = CARD_NOTIFICATION_DICT[cardId];
		if (!cardInfo) return;

		/**
		 * Resolver ID a Nombre
		 */
		const resolveName = (id: string | null | undefined) => {
			if (!id) return "Alguien";
			if (String(id) === String(myId)) return me?.name;
			const opponent = opponents.find((o) => String(o.id) === String(id));
			return opponent ? opponent.name : `Jugador ${id}`;
		};

		const sourceName = resolveName(sourceId);
		const targetName = resolveName(targetId);

		/**
		 * Obtiene el objeto completo del target para comprobar su estado de muerte
		 */
		const targetObj = targetId
			? String(targetId) === String(myId)
				? me
				: opponents.find((o) => String(o.id) === String(targetId))
			: null;

		let message = "";
		const isMeSource = String(sourceId) === String(myId);
		const isMeTarget = targetId ? String(targetId) === String(myId) : false;

		/**  Comprobar si este ataque concreto ha sido el causante de la muerte */
		const isLethal =
			targetObj?.is_dead && targetObj?.killer_name === sourceName;

		switch (cardInfo.type) {
			case "attack":
				if (cardInfo.scope === "opponents") {
					message = isMeSource
						? `Has usado ${cardInfo.name}`
						: `¡${sourceName} te ha atacado con ${cardInfo.name}!`;
				} else {
					if (isLethal) {
						// Si hay muerte
						if (isMeTarget) message = `¡${sourceName} te ha eliminado!`;
						else if (isMeSource) message = `¡Has eliminado a ${targetName}!`;
						else message = `¡${sourceName} ha eliminado a ${targetName}!`;
					} else {
						// Si el ataque fue normal
						if (isMeTarget) message = `¡${sourceName} te ha atacado!`;
						else if (isMeSource) message = `Has atacado a ${targetName}`;
						else message = `${sourceName} atacó a ${targetName}`;
					}
				}
				break;

			case "heal":
				if (cardInfo.scope === "all") {
					message = isMeSource
						? `Has usado ${cardInfo.name} (Todos se curan)`
						: `${sourceName} usó ${cardInfo.name} (Todos se curan)`;
				} else {
					// Verificar si la carta es específicamente la de Resurrección
					const isRevive = cardId === 17;
					const actionVerb = isRevive ? "revivido" : "curado";

					if (isMeSource) {
						message =
							targetId && !isMeTarget
								? `Has ${actionVerb} a ${targetName}`
								: `Te has ${actionVerb}`;
					} else {
						if (isMeTarget) {
							message = `${sourceName} te ha ${actionVerb}`;
						} else {
							message = targetId
								? `${sourceName} ha ${actionVerb} a ${targetName}`
								: `${sourceName} se ha ${actionVerb}`;
						}
					}
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
