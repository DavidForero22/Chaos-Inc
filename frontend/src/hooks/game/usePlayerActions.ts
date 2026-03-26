// frontend/src/hooks/game/usePlayerActions.ts
import { useState } from "react";
import { useGameStore } from "../../store/useGameStore";
import { useGameUIStore } from "../../store/useGameUIStore";
import { usePlayerIdentity } from "../usePlayerIdentity";

export function usePlayerActions() {
	const { myPlayerName } = usePlayerIdentity();

	// --- ESTADO GLOBAL ---
	const me = useGameStore((state) => state.gameData?.me);
	const game = useGameStore((state) => state.gameData?.game);
	const reactToAttack = useGameStore((state) => state.reactToAttack);
	const reactToMultiAttack = useGameStore((state) => state.reactToMultiAttack);
	const endTurn = useGameStore((state) => state.endTurn);
	const discardCards = useGameStore((state) => state.discardCards);
	const discardPerks = useGameStore((state) => state.discardPerks);
	const resolveSabotage = useGameStore((state) => state.resolveSabotage);

	// --- ESTADO UI ---
	const {
		isDiscardMode,
		cardsToDiscard,
		perksToDiscard,
		setIsDiscardMode,
		clearDiscardSelection,
	} = useGameUIStore();

	// --- ESTADO LOCAL (Seguro de concurrencia) ---
	const [isSubmitting, setIsSubmitting] = useState(false);

	if (!me || !game || !myPlayerName) {
		return { isReady: false as const };
	}

	// --- VARIABLES DERIVADAS ---
	const isMyTurn = game.current_turn === myPlayerName;
	const isTurnFrozen = game.ending_soon || game.effectively_over;
	const hasPendingAttack = me.combat_state.is_attacking_single;
	const hasPendingMultiAttack = me.combat_state.is_defending_multi;
	const isAttackerWaiting = me.combat_state.is_attacking_multi;
	const hasPendingSabotage =
		!!game.player_pending_sabotage &&
		game.player_pending_sabotage !== myPlayerName;

	const currentCardsCount = me.cards.length;
	const projectedCardsCount = currentCardsCount - cardsToDiscard.length;
	const isOverLimit = currentCardsCount > me.max_hand_size;
	const willBeOverLimit = projectedCardsCount > me.max_hand_size;

	const noSelection =
		cardsToDiscard.length === 0 && perksToDiscard.length === 0;
	const isEvadingSabotage =
		me.conditions.must_discard && cardsToDiscard.length === 0;

	// --- CONDICIONES DE BOTONES ---
	const isConfirmDisabled =
		willBeOverLimit || noSelection || isEvadingSabotage || isSubmitting;

	const canEndTurn =
		isMyTurn &&
		!hasPendingAttack &&
		!isTurnFrozen &&
		!isAttackerWaiting &&
		!isOverLimit &&
		!me.conditions.must_discard &&
		!hasPendingSabotage &&
		!isDiscardMode;

	const canDiscard =
		isMyTurn &&
		!isTurnFrozen &&
		!isAttackerWaiting &&
		!hasPendingAttack &&
		!me.conditions.must_discard &&
		!hasPendingSabotage &&
		currentCardsCount > 0;

	// --- ACCIONES SECUENCIALES ---
	const handleConfirmDiscard = async () => {
		if (isSubmitting) return;
		setIsSubmitting(true);

		try {
			if (me.conditions.must_discard) {
				if (cardsToDiscard.length > 0) await resolveSabotage(cardsToDiscard[0]);
			} else {
				if (cardsToDiscard.length > 0) await discardCards(cardsToDiscard);
			}

			if (perksToDiscard.length > 0) {
				await discardPerks(perksToDiscard);
			}
		} finally {
			clearDiscardSelection();
			setIsSubmitting(false);
		}
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
		isConfirmDisabled,
		hasPendingMultiAttack,
		handleConfirmDiscard,
		reactToAttack,
		reactToMultiAttack,
		endTurn,
		setIsDiscardMode,
		clearDiscardSelection,
	};
}
