// src/hooks/game/usePlayerActions.ts

import { useGameStore } from "../../../store/game/useGameStore";
import { useGameUIStore } from "../../../store/game/useGameUIStore";
import { useAuth } from "../../auth/useAuth";
import { useState } from "react";
import { useLoadingStore } from "../../../store/ui/useLoadingStore";
import { useGameActions } from "../../../store/game/useGameActions";

export function usePlayerActions() {
	const { id: myId } = useAuth();

	const me = useGameStore((state) => state.gameData?.me);
	const game = useGameStore((state) => state.gameData?.game);

	// Todas las acciones ahora en useGameActions
	const reactToAttack = useGameActions((state) => state.reactToAttack);
	const reactToMultiAttack = useGameActions(
		(state) => state.reactToMultiAttack,
	);
	const endTurn = useGameActions((state) => state.endTurn);
	const discardCards = useGameActions((state) => state.discardCards);
	const discardPerks = useGameActions((state) => state.discardPerks);
	const resolveSabotage = useGameActions((state) => state.resolveSabotage);
	const playTurn = useGameActions((state) => state.playTurn);
	const isActionLocked = useGameActions((state) => state.isActionLocked);

	const {
		isDiscardMode,
		isInfoMode,
		cardsToDiscard,
		perksToDiscard,
		selectedCardId,
		setSelectedCardId,
		setIsDiscardMode,
		setIsInfoMode,
		clearDiscardSelection,
		isSacrificeMode,
		sacrificeCardId,
		clearSacrifice,
	} = useGameUIStore();

	const [isSubmitting, setIsSubmitting] = useState(false);
	const requestCount = useLoadingStore((state) => state.requestCount);
	const isGlobalLoading = requestCount > 0 || isActionLocked;

	if (!me || !game || !myId) {
		return { isReady: false as const };
	}

	const isMyTurn = String(game.current_turn) === String(myId);
	const isTurnFrozen = game.ending_soon || game.effectively_over;
	const hasPendingMultiAttack = me.combat_state.is_defending_multi;

	const currentCardsCount = me.cards.length;
	const projectedCardsCount = currentCardsCount - cardsToDiscard.length;
	const isOverLimit = currentCardsCount > me.max_hand_size;
	const willBeOverLimit = projectedCardsCount > me.max_hand_size;
	const isSomeoneWaitingForReaction =
		game.pending_single_attack_target !== null ||
		(game.pending_multi_attack_targets &&
			game.pending_multi_attack_targets.length > 0) ||
		game.player_pending_sabotage !== null ||
		game.player_in_luck_challenge !== null;

	const hasEquippedPerks =
		me.perks.has_shield ||
		me.perks.has_distance ||
		me.perks.has_storage ||
		me.perks.has_luck ||
		(me.perks.vision_bonus ?? 0) > 0;

	const noSelection =
		cardsToDiscard.length === 0 && perksToDiscard.length === 0;
	const isEvadingSabotage =
		me.conditions.must_discard && cardsToDiscard.length === 0;
	const isConfirmDisabled =
		noSelection || isEvadingSabotage || isSubmitting || isGlobalLoading;

	const selectedCard = me.cards.find((c) => c.id === selectedCardId);

	// Detectar si la carta seleccionada es de auto-uso
	const isSelfTargetCard = selectedCard
		? ["self", "all", "opponents", "none"].includes(selectedCard.target)
		: false;

	// Detectar si la carta seleccionada es caótica y requiere sacrificio
	const isChaoticCard = selectedCard?.category === "chaotic";

	// Saber si tiene al menos otra carta para sacrificar (excluyendo la propia caótica)
	const hasOtherCards = isChaoticCard && me.cards.length > 1;

	/**  La carta caótica es usable si:
		- No es caótica, o
		- Es caótica Y (no estamos en modo sacrificio O ya tenemos carta de sacrificio)
		- Hay  otra carta en mano
	*/
	const canUseChaotic =
		!isChaoticCard ||
		(isSacrificeMode && sacrificeCardId !== null && hasOtherCards);

	const canUseCard =
		isMyTurn &&
		selectedCardId !== null &&
		isSelfTargetCard &&
		!isTurnFrozen &&
		!isSomeoneWaitingForReaction &&
		!isInfoMode &&
		!isGlobalLoading &&
		canUseChaotic;

	const canEndTurn =
		isMyTurn &&
		!isTurnFrozen &&
		!isSomeoneWaitingForReaction &&
		!isOverLimit &&
		!me.conditions.must_discard &&
		!isDiscardMode &&
		!isInfoMode &&
		selectedCardId === null &&
		!isGlobalLoading &&
		!(isSacrificeMode && sacrificeCardId === null);

	const canDiscard =
		isMyTurn &&
		!isTurnFrozen &&
		!isSomeoneWaitingForReaction &&
		!me.conditions.must_discard &&
		!isInfoMode &&
		(currentCardsCount > 0 || hasEquippedPerks) &&
		!isGlobalLoading &&
		selectedCardId === null;

	const handleConfirmDiscard = async () => {
		if (isSubmitting) return;
		setIsSubmitting(true);
		try {
			if (me.conditions.must_discard) {
				if (cardsToDiscard.length > 0) await resolveSabotage(cardsToDiscard[0]);
			} else {
				if (cardsToDiscard.length > 0) await discardCards(cardsToDiscard);
			}
			if (perksToDiscard.length > 0) await discardPerks(perksToDiscard);
		} finally {
			clearDiscardSelection();
			setIsSubmitting(false);
		}
	};

	// Usar la carta seleccionada de auto-uso
	const handleUseCard = async () => {
		if (!canUseCard || !selectedCardId) return;

		// Si es caótica, usar el sacrificeCardId
		const sacrificeId = isChaoticCard
			? (sacrificeCardId ?? undefined)
			: undefined;
		await playTurn(selectedCardId, String(myId), undefined, sacrificeId);

		setSelectedCardId(null);
		clearSacrifice(); // limpiar modo sacrificio después de usar
	};

	return {
		isReady: true as const,
		me,
		isDiscardMode,
		isInfoMode,
		currentCardsCount,
		projectedCardsCount,
		willBeOverLimit,
		isOverLimit,
		canEndTurn,
		canDiscard,
		canUseCard,
		isConfirmDisabled,
		hasPendingMultiAttack,
		isGlobalLoading,
		handleConfirmDiscard,
		handleUseCard,
		reactToAttack,
		reactToMultiAttack,
		endTurn,
		setIsDiscardMode,
		setIsInfoMode,
		clearDiscardSelection,
		isSacrificeMode,
		sacrificeCardId,
		clearSacrifice,
	};
}
