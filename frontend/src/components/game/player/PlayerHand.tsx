// frontend/src/components/game/player/PlayerHand.tsx
import { Card } from "../ui/Card.tsx";
import { useGameStore } from "../../../store/useGameStore.ts";
import { useGameUIStore } from "../../../store/useGameUIStore.ts";
import { usePlayerIdentity } from "../../../hooks/usePlayerIdentity.ts";
import { useCardPlayability } from "../../../hooks/game/useCardPlayability.ts"; 
import type { CardInstance } from "../../../types/live-game.ts";

export function PlayerHand() {
	const { myPlayerName } = usePlayerIdentity();

	// --- ESTADO GLOBAL Y UI ---
	const gameData = useGameStore((state) => state.gameData);
	const reactToAttack = useGameStore((state) => state.reactToAttack);
	const reactToMultiAttack = useGameStore((state) => state.reactToMultiAttack);
	const playTurn = useGameStore((state) => state.playTurn);

	const {
		isDiscardMode,
		cardsToDiscard,
		toggleDiscardCard,
		selectedCardId,
		setSelectedCardId,
	} = useGameUIStore();

	// Hook inteligente que nos dice si las cartas se pueden jugar o no
	const { evaluateCard, globalConditions } = useCardPlayability(
		gameData!, // Asumimos que existe porque validamos abajo
		myPlayerName!,
		isDiscardMode,
	);

	if (!gameData || !myPlayerName) return null;
	const { me } = gameData;

	// --- MANEJADOR DE CLIC CENTRALIZADO ---
	const handleCardClick = (card: CardInstance) => {
		if (isDiscardMode) {
			const maxCards = me.conditions.must_discard ? 1 : undefined;
			toggleDiscardCard(card.id, maxCards);
			return;
		}

		const {
			hasPendingMultiAttack,
			isMyTurn,
			hasLuckChallenge,
			isAttackerWaiting,
		} = globalConditions;
		const canUseDodgeNow = evaluateCard(card).canUseDodgeNow;

		if (canUseDodgeNow) {
			if (hasPendingMultiAttack) {
				reactToMultiAttack("dodge", card.id);
			} else {
				reactToAttack("dodge", card.id);
			}
			return;
		}

		if (!isMyTurn || hasLuckChallenge || isAttackerWaiting) return;

		// Auto-uso: Cartas que se juegan instantáneamente sobre ti mismo
		if (card.type === 2 && me.stress > 0)
			return playTurn(card.id, myPlayerName);
		if (card.type === 5 && !me.perks.has_shield)
			return playTurn(card.id, myPlayerName);
		if (card.type === 7 && !me.turn_limits.multi_attack_used)
			return playTurn(card.id, myPlayerName);
		if (card.type === 1 && me.turn_limits.single_attack_used) return;
		if (card.type === 8) return playTurn(card.id, myPlayerName);
		if (card.type === 10 && (me.perks.vision_bonus ?? 0) < 2)
			return playTurn(card.id, myPlayerName);
		if (card.type === 11 && (me.perks.distance_bonus ?? 0) < 1)
			return playTurn(card.id, myPlayerName);
		if (card.type === 13 && !me.perks.has_storage)
			return playTurn(card.id, myPlayerName);

		// Si es una carta de targeteo a otro, seleccionarla
		setSelectedCardId(selectedCardId === card.id ? null : card.id);
	};

	return (
		<div className="flex-1 min-w-0 border-l border-gray-700 pl-6 flex flex-col">
			<p className="text-xs text-gray-500 uppercase font-bold mb-3">Tu Mano</p>

			<div className="w-full flex gap-3 overflow-x-auto no-scrollbar py-2 pt-6 min-h-36">
				{me.cards.length === 0 ? (
					<div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-700 rounded-xl text-gray-500 opacity-50">
						<p className="italic text-sm">Sin cartas en la mano</p>
					</div>
				) : (
					me.cards.map((card) => {
						const { isSelectable, canUseDodgeNow } = evaluateCard(card);
						const isSelected = selectedCardId === card.id;
						const isMarkedForDiscard = cardsToDiscard.includes(card.id);

						return (
							<Card
								key={card.id}
								card={card}
								isSelectable={isSelectable}
								isSelected={!isDiscardMode && isSelected}
								isHighlighted={!isDiscardMode && canUseDodgeNow}
								isMarkedForDiscard={isDiscardMode && isMarkedForDiscard}
								onClick={() => {
									if (!isSelectable) return;
									handleCardClick(card);
								}}
							/>
						);
					})
				)}
			</div>
		</div>
	);
}
