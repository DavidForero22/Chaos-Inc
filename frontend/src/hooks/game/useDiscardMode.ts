import { useState } from "react";

export function useDiscardMode(
	onDiscardCards?: (cardIds: string[]) => void,
	maxCards?: number,
) {
	const [isDiscardMode, setIsDiscardMode] = useState(false);
	const [cardsToDiscard, setCardsToDiscard] = useState<string[]>([]);

	const toggleCard = (cardId: string) => {
		setCardsToDiscard((prev) => {
			if (prev.includes(cardId)) return prev.filter((id) => id !== cardId);
			if (maxCards !== undefined && prev.length >= maxCards) return [cardId];
			return [...prev, cardId];
		});
	};

	const confirmDiscard = () => {
		if (onDiscardCards && cardsToDiscard.length > 0) {
			onDiscardCards(cardsToDiscard);
		}
		setIsDiscardMode(false);
		setCardsToDiscard([]);
	};

	const cancelDiscard = () => {
		setIsDiscardMode(false);
		setCardsToDiscard([]);
	};

	return {
		isDiscardMode,
		cardsToDiscard,
		setIsDiscardMode,
		toggleCard,
		confirmDiscard,
		cancelDiscard,
	};
}
