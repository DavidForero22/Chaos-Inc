// frontend/src/components/game/player/PlayerHand.tsx
import { Card } from "../ui/Card.tsx";
import { useGameStore } from "../../../store/useGameStore.ts";
import { useGameUIStore } from "../../../store/useGameUIStore.ts";
import { useAuth } from "../../../hooks/useAuth.ts";
import { useCardPlayability } from "../../../hooks/game/useCardPlayability.ts";
import type { CardInstance } from "../../../types/live-game.ts";
import styles from "./PlayerHand.module.css";

export function PlayerHand() {
    const { id } = useAuth();

    // --- ESTADO GLOBAL Y UI ---
    const gameData = useGameStore((state) => state.gameData);
    const reactToAttack = useGameStore((state) => state.reactToAttack);
    const reactToMultiAttack = useGameStore((state) => state.reactToMultiAttack);
    const isActionLocked = useGameStore((state) => state.isActionLocked);

    const {
        isDiscardMode,
        cardsToDiscard,
        toggleDiscardCard,
        selectedCardId,
        setSelectedCardId,
    } = useGameUIStore();

    const { evaluateCard, globalConditions } = useCardPlayability(
        gameData!,
        id!,
        isDiscardMode,
    );

    if (!gameData || !id) return null;
    const { me } = gameData;

    // --- MANEJADOR DE CLIC CENTRALIZADO ---
    const handleCardClick = (card: CardInstance) => {
        if (isActionLocked) return;

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
        const { canUseDodgeNow } = evaluateCard(card);

        if (canUseDodgeNow) {
            if (hasPendingMultiAttack) {
                reactToMultiAttack("dodge", card.id);
            } else {
                reactToAttack("dodge", card.id);
            }
            return;
        }

        if (!isMyTurn || hasLuckChallenge || isAttackerWaiting) return;

        setSelectedCardId(selectedCardId === card.id ? null : card.id);
    };

    return (
        <div className={styles.handContainer}>
            {/* El contenedor escrolleable y oscuro del bolsillo */}
            <div className={styles.cardsScrollArea}>
                {me.cards.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-[#3b2f24] rounded-lg text-[#3b2f24] opacity-60 h-auto m-7">
                        <p className="italic text-xl font-bold uppercase tracking-widest">
                            Sin Cartas
                        </p>
                    </div>
                ) : (
                    me.cards.map((card) => {
                        console.log(card)
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