import { Card } from "../ui/Card.tsx";
import type {
	CardInstance,
	MyData,
	Opponent,
} from "../../../types/live-game.ts";

interface PlayerHandProps {
	me: MyData;
	isMyTurn: boolean;
	selectedCardId: string | null;
	onCardClick: (card: CardInstance) => void;
	incomingAttack: boolean;
	opponents: Opponent[];
	hasPendingAttack: boolean;
}

export function PlayerHand({
	me,
	isMyTurn,
	selectedCardId,
	onCardClick,
	incomingAttack,
	opponents,
	hasPendingAttack,
}: PlayerHandProps) {
	// Helper para no repetir código dentro del map
	const anyOpponentHasCards = opponents.some(
		(o) => o.cards_count > 0 && o.is_online,
	);

	return (
		<div className="flex-1 min-w-0 border-l border-gray-700 pl-6">
			<p className="text-xs text-gray-500 uppercase font-bold mb-3">Tu Mano</p>
			<div className="w-full flex gap-3 overflow-x-auto overflow-y-visible no-scrollbar py-2">
				{me.cards.map((card) => {
					const isSelected = selectedCardId === card.id;

					// --- REGLAS DE NEGOCIO (DESHABILITACIONES) ---
					const isHealDisabled = card.type === 2 && me.stress <= 0;
					const isAttackDisabled = card.type === 1 && me.attack_used_this_turn;
					const isDodgeDisabled = card.type === 3 && !incomingAttack;
					const isStealDisabled = card.type === 4 && !anyOpponentHasCards;
					const isShieldDisabled = card.type === 5 && me.has_shield;
					const isBlockDisabled =
						card.type === 6 &&
						!opponents.some((o) => !o.is_dead && o.is_online && !o.is_blocked);

					const isDisabled =
                        isHealDisabled ||
                        isAttackDisabled ||
                        isDodgeDisabled ||
                        isStealDisabled ||
                        isShieldDisabled ||
                        isBlockDisabled;

					// --- ESTADOS INTERACTIVOS ---
					const isDodge = card.type === 3;
					const canUseDodgeNow = incomingAttack && isDodge;

					// Solo es seleccionable si:
					// 1. Es mi turno, no está bloqueada por reglas, y no estoy esperando resolver un ataque propio
					// OR 2. Me están atacando y es una carta de esquivar
					const isSelectable =
						(isMyTurn && !isDisabled && !hasPendingAttack) || canUseDodgeNow;

					return (
						<Card
							key={card.id}
							card={card}
							isSelectable={isSelectable}
							isSelected={isSelected}
							isHighlighted={canUseDodgeNow}
							onClick={() => {
								// Doble check de seguridad por si acaso
								if (!isSelectable) return;
								onCardClick(card);
							}}
						/>
					);
				})}
			</div>
		</div>
	);
}
