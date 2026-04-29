// src/hooks/game/usePlayerActions.ts

import { useGameStore } from "../../store/useGameStore";
import { useGameUIStore } from "../../store/useGameUIStore";
import { useAuth } from "../useAuth";
import { useState } from "react";
import { useLoadingStore } from "../../store/useLoadingStore";

export function usePlayerActions() {
	const { user } = useAuth();

	const me = useGameStore((state) => state.gameData?.me);
	const game = useGameStore((state) => state.gameData?.game);
	const reactToAttack = useGameStore((state) => state.reactToAttack);
	const reactToMultiAttack = useGameStore((state) => state.reactToMultiAttack);
	const endTurn = useGameStore((state) => state.endTurn);
	const discardCards = useGameStore((state) => state.discardCards);
	const discardPerks = useGameStore((state) => state.discardPerks);
	const resolveSabotage = useGameStore((state) => state.resolveSabotage);
	const playTurn = useGameStore((state) => state.playTurn);
	const isActionLocked = useGameStore((state) => state.isActionLocked);

	const {
		isDiscardMode,
		cardsToDiscard,
		perksToDiscard,
		selectedCardId,
		setSelectedCardId,
		setIsDiscardMode,
		clearDiscardSelection,
	} = useGameUIStore();

	const [isSubmitting, setIsSubmitting] = useState(false);
	const requestCount = useLoadingStore((state) => state.requestCount);
	const isGlobalLoading = requestCount > 0 || isActionLocked;

	if (!me || !game || !user) {
		return { isReady: false as const };
	}

	const isMyTurn = game.current_turn === user;
	const isTurnFrozen = game.ending_soon || game.effectively_over;
	const hasPendingAttack = me.combat_state.is_attacking_single;
	const hasPendingMultiAttack = me.combat_state.is_defending_multi;
	const isAttackerWaiting = me.combat_state.is_attacking_multi;
	const hasPendingSabotage =
		!!game.player_pending_sabotage && game.player_pending_sabotage !== user;

	const currentCardsCount = me.cards.length;
	const projectedCardsCount = currentCardsCount - cardsToDiscard.length;
	const isOverLimit = currentCardsCount > me.max_hand_size;
	const willBeOverLimit = projectedCardsCount > me.max_hand_size;

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

	// Detectar si la carta seleccionada es de auto-uso leyendo su target directamente
	const selectedCard = me.cards.find((c) => c.id === selectedCardId);
	const isSelfTargetCard = selectedCard
		? ["self", "all", "none"].includes(selectedCard.target)
		: false;

	const canUseCard =
		isMyTurn &&
		selectedCardId !== null &&
		isSelfTargetCard &&
		!isTurnFrozen &&
		!isAttackerWaiting &&
		!isGlobalLoading;

	const canEndTurn =
		isMyTurn &&
		!hasPendingAttack &&
		!isTurnFrozen &&
		!isAttackerWaiting &&
		!isOverLimit &&
		!me.conditions.must_discard &&
		!hasPendingSabotage &&
		!isDiscardMode &&
		selectedCardId === null &&
		!isGlobalLoading;

	const canDiscard =
		isMyTurn &&
		!isTurnFrozen &&
		!isAttackerWaiting &&
		!hasPendingAttack &&
		!me.conditions.must_discard &&
		!hasPendingSabotage &&
		(currentCardsCount > 0 || hasEquippedPerks) &&
		!isGlobalLoading;

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
		await playTurn(selectedCardId, user);
		setSelectedCardId(null);
	};

	return {
		isReady: true as const,
		me,
		isDiscardMode,
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
		clearDiscardSelection,
	};
}
