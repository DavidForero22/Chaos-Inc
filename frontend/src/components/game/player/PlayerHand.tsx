// frontend/src/components/game/player/PlayerHand.tsx
import { useRef, useState } from "react";
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

    // --- REFERENCIAS PARA EL SCROLL POR ARRASTRE ---
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);
    const startX = useRef(0);
    const scrollLeft = useRef(0);
    const dragDistance = useRef(0); // Para diferenciar entre un clic y un arrastre
    
    // Estado solo para la UI del cursor (grab vs grabbing)
    const [isGrabbing, setIsGrabbing] = useState(false);

    if (!gameData || !id) return null;
    const { me } = gameData;

    // --- LÓGICA DE ARRASTRE (DRAG TO SCROLL) ---
    const handleMouseDown = (e: React.MouseEvent) => {
        if (!scrollContainerRef.current) return;
        isDragging.current = true;
        setIsGrabbing(true);
        dragDistance.current = 0; // Reiniciar distancia
        startX.current = e.pageX - scrollContainerRef.current.offsetLeft;
        scrollLeft.current = scrollContainerRef.current.scrollLeft;
    };

    const handleMouseLeave = () => {
        isDragging.current = false;
        setIsGrabbing(false);
    };

    const handleMouseUp = () => {
        isDragging.current = false;
        setIsGrabbing(false);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging.current || !scrollContainerRef.current) return;
        e.preventDefault(); // Evita que seleccione texto/imágenes accidentalmente

        const x = e.pageX - scrollContainerRef.current.offsetLeft;
        const walk = (x - startX.current) ; 
        
        // Acumular la distancia total movida en valor absoluto
        dragDistance.current += Math.abs(x - startX.current);
        
        scrollContainerRef.current.scrollLeft = scrollLeft.current - walk;
    };

    // Interceptar clics en fase de captura para evitar jugar cartas al arrastrar
    const handleClickCapture = (e: React.MouseEvent) => {
        // Si el usuario movió el ratón más de 10 píxeles, se considera un "scroll"
        if (dragDistance.current > 10) {
            e.stopPropagation(); // Evita que el evento onClick llegue a la carta
            e.preventDefault();
        }
    };

    // --- MANEJADOR DE CLIC CENTRALIZADO DE LA CARTA ---
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
            <div 
                ref={scrollContainerRef}
                className={`${styles.cardsScrollArea} ${isGrabbing ? 'cursor-grabbing' : 'cursor-grab'}`}
                
                // Eventos de arrastre
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                onClickCapture={handleClickCapture}

                // ARIA para Accesibilidad
                role="region"
                aria-label="Tu mano de cartas"
            >
                {me.cards.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-[#3b2f24] rounded-lg text-[#3b2f24] opacity-60 h-auto m-7 pointer-events-none">
                        <p className="italic text-xl font-bold uppercase tracking-widest">
                            Sin Cartas
                        </p>
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