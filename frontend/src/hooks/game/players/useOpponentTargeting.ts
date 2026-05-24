import { useGameUIStore } from "../../../store/game/useGameUIStore";
import type { Opponent, CardInstance } from "../../../types/live-game";

type NonOpponentTarget = Exclude<CardInstance["target"], "opponent">;

const isOpponentTargetCard = (
	card: CardInstance | null,
): card is CardInstance & { target: "opponent" } =>
	!!card && card.target === "opponent";

const isNonOpponentTargetCard = (
	card: CardInstance | null,
): card is CardInstance & { target: NonOpponentTarget } =>
	!!card && card.target !== "opponent";

export function useOpponentTargeting(
	player: Opponent,
	selectedCard: CardInstance | null,
	isMyTurn: boolean,
) {
	const { isSacrificeMode, sacrificeCardId } = useGameUIStore();

	const isCardActive = isMyTurn && selectedCard !== null;
	const isTargetingCard = isOpponentTargetCard(selectedCard);
	const isNonOpponentTarget = isNonOpponentTargetCard(selectedCard);
	const isReviveCard = selectedCard?.card_id === 17;
	const isCleanMode = selectedCard?.card_id === 12 && isMyTurn;

	const isCurrentlyBlocked =
		player.conditions?.is_blocked ?? (player as any).is_blocked ?? false;

	let tooltipMessage = "";
	let isUnclickable = false;
	let canBeTargeted = false;

	// 1. Condiciones generales (independientes de la carta)
	if (!player.is_online) {
		tooltipMessage = "Este jugador está desconectado.";
		isUnclickable = true;
	}

	// 2. Lógica específica según la carta seleccionada
	if (isCardActive && isTargetingCard) {
		if (isReviveCard) {
			// REVIVIR: solo objetivos muertos y conectados
			if (player.is_dead && player.is_online) {
				canBeTargeted = true;
				isUnclickable = false;
				tooltipMessage = "Revivir a este jugador";
			} else {
				canBeTargeted = false;
				isUnclickable = true;
				tooltipMessage = player.is_dead
					? "Este jugador ya está vivo"
					: "Solo puedes revivir a jugadores derrotados";
			}
		} else {
			// OTRAS CARTAS: comportamiento original
			if (player.is_dead) {
				tooltipMessage = "Este jugador ya está muerto.";
				isUnclickable = true;
			} else {
				// Validar rango, robo, bloqueo, sabotaje...
				const isOutOfRange = selectedCard?.card_id === 1 && !player.is_in_range;
				const isUnstealable =
					selectedCard?.card_id === 4 && player.cards_count === 0;
				const isPlayerBlocked =
					selectedCard?.card_id === 6 && isCurrentlyBlocked;
				const isSabotageUntargetable =
					selectedCard?.card_id === 9 && player.cards_count === 0;

				if (isOutOfRange) {
					tooltipMessage =
						"Este jugador está demasiado lejos para tu rango actual.";
					isUnclickable = true;
				} else if (isUnstealable) {
					tooltipMessage = "Este jugador no tiene cartas que robar.";
					isUnclickable = true;
				} else if (isPlayerBlocked) {
					tooltipMessage = "Este jugador ya tiene un bloqueo activo.";
					isUnclickable = true;
				} else if (isSabotageUntargetable) {
					tooltipMessage = "Este jugador no tiene cartas que descartar.";
					isUnclickable = true;
				}

				if (!isUnclickable) {
					canBeTargeted = true;
				}
			}
		}
	} else if (isCardActive && isNonOpponentTarget) {
		tooltipMessage =
			selectedCard?.target === "self"
				? "Esta carta es de auto-uso."
				: "Esta carta no se usa sobre oponentes.";
		isUnclickable = true;
	}

	// 3. Modo sacrificio (tiene prioridad sobre todo)
	const isWaitingForSacrifice = isSacrificeMode && sacrificeCardId === null;
	if (isWaitingForSacrifice) {
		tooltipMessage = "Debes elegir una carta para sacrificar antes de atacar.";
		isUnclickable = true;
		canBeTargeted = false;
	}

	const canCleanGlobally = isCleanMode && !player.is_dead && player.is_online;

	return {
		tooltipMessage,
		isUnclickable,
		canBeTargeted,
		isCurrentlyBlocked,
		isWaitingForSacrifice,
		isNonOpponentTarget,
		isReviveCard,
		canCleanGlobally,
	};
}
