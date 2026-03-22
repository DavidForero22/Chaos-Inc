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
	hasPendingMultiAttack: boolean;
	isAttackerWaiting: boolean;
	isDiscardMode?: boolean; // ← nuevo
	cardsToDiscard?: string[]; // ← nuevo
}

export function PlayerHand({
	me,
	isMyTurn,
	selectedCardId,
	onCardClick,
	incomingAttack,
	opponents,
	hasPendingAttack,
	hasPendingMultiAttack,
	isAttackerWaiting,
	isDiscardMode = false,
	cardsToDiscard = [],
}: PlayerHandProps) {
	const anyOpponentHasCards = opponents.some(
		(o) => o.cards_count > 0 && o.is_online,
	);
	const anyoneHasStress =
		opponents.some((o) => !o.is_dead && o.stress > 0) || me.stress > 0;

	return (
		<div className="flex-1 min-w-0 border-l border-gray-700 pl-6">
			<p className="text-xs text-gray-500 uppercase font-bold mb-3">Tu Mano</p>
			<div className="w-full flex gap-3 overflow-x-auto no-scrollbar py-2 pt-6">
				{me.cards.map((card) => {
					const isSelected = selectedCardId === card.id;
					const isMarkedForDiscard = cardsToDiscard.includes(card.id);

					const isHealDisabled = card.type === 2 && me.stress <= 0;
					const isAttackDisabled =
						card.type === 1 && me.turn_limits.single_attack_used;
					const isAttackAllDisabled =
						card.type === 7 && me.turn_limits.multi_attack_used;
					const isDodgeDisabled =
						card.type === 3 && !incomingAttack && !hasPendingMultiAttack;
					const isStealDisabled = card.type === 4 && !anyOpponentHasCards;
					const isShieldDisabled = card.type === 5 && me.conditions.has_shield;
					const isBlockDisabled =
						card.type === 6 &&
						!opponents.some((o) => {
							const isBlocked =
								o.conditions?.is_blocked ?? (o as any).is_blocked;
							return !o.is_dead && o.is_online && !isBlocked;
						});
					const isHealAllDisabled = card.type === 8 && !anyoneHasStress;

					const isDisabled =
						isHealDisabled ||
						isAttackDisabled ||
						isDodgeDisabled ||
						isStealDisabled ||
						isShieldDisabled ||
						isBlockDisabled ||
						isHealAllDisabled ||
						isAttackAllDisabled;

					const isDodge = card.type === 3;
					const canUseDodgeNow =
						(incomingAttack || hasPendingMultiAttack) && isDodge;

					// En modo descarte todas las cartas son seleccionables
					const isSelectable = isDiscardMode
						? true
						: (isMyTurn &&
								!isDisabled &&
								!hasPendingAttack &&
								!isAttackerWaiting) ||
							canUseDodgeNow;

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
								onCardClick(card);
							}}
						/>
					);
				})}
			</div>
		</div>
	);
}
