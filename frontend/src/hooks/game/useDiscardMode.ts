import { useState } from "react";

export function useDiscardMode(onDiscardCards?: (cardIds: string[]) => void) {
	const [isDiscardMode, setIsDiscardMode] = useState(false);
	const [cardsToDiscard, setCardsToDiscard] = useState<string[]>([]);

	const toggleCard = (cardId: string) => {
		setCardsToDiscard((prev) =>
			prev.includes(cardId)
				? prev.filter((id) => id !== cardId)
				: [...prev, cardId],
		);
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
