import type { CardInstance, MyData, Opponent } from "../../types/types.ts";

interface PlayerHandProps {
	me: MyData;
	isMyTurn: boolean;
	selectedCardId: string | null;
	onCardClick: (card: CardInstance) => void;
	incomingAttack: boolean;
	opponents: Opponent[];
}

export function PlayerHand({
	me,
	isMyTurn,
	selectedCardId,
	onCardClick,
	incomingAttack,
	opponents,
}: PlayerHandProps) {
	return (
		<div className="flex-1 min-w-0 border-l border-gray-700 pl-6">
			<p className="text-xs text-gray-500 uppercase font-bold mb-3">Tu Mano</p>
			<div className="w-full flex gap-3 overflow-x-auto overflow-y-visible no-scrollbar py-2">
				{me.cards.map((card) => {
					const isSelected = selectedCardId === card.id;
					const isHeal = card.type === 2;
					const isHealDisabled = isHeal && me.stress <= 0;

					const isAttack = card.type === 1;
					const isAttackDisabled = isAttack && me.attack_used_this_turn;

					const isDodge = card.type === 3;
					const canUseDodgeNow = incomingAttack && isDodge;
					const isDodgeDisabled = isDodge && !incomingAttack;

					const anyOpponentHasCards = opponents.some(
						(o) => o.cards_count > 0 && o.is_online,
					);
					const isSteal = card.type === 4;
					const isStealDisabled = isSteal && !anyOpponentHasCards;

					const isDisabled =
						isHealDisabled ||
						isAttackDisabled ||
						isDodgeDisabled ||
						isStealDisabled;

					return (
						<div
							key={card.id}
							onClick={() => {
								// Si es esquive y hay ataque entrante, permitimos usarla aunque no sea nuestro turno.
								if (!canUseDodgeNow && isDisabled) return;
								onCardClick(card);
							}}
							className={`
								shrink-0 w-24 h-36 rounded-lg border flex items-center justify-center shadow-lg transition-all text-center px-2
								${
									(isMyTurn && !isDisabled) || canUseDodgeNow
										? "cursor-pointer hover:-translate-y-4"
										: "opacity-40 cursor-not-allowed"
								}
								${
									isSelected
										? "bg-blue-800 border-blue-400 -translate-y-4 shadow-blue-500/50 ring-2 ring-blue-400"
										: canUseDodgeNow
											? "bg-yellow-900/40 border-yellow-400 ring-2 ring-yellow-400"
											: "bg-gray-700 border-gray-500"
								}
							`}
							title={card.description}
						>
							<span className="text-sm text-gray-200 font-semibold leading-snug">
								{card.name}
							</span>
						</div>
					);
				})}
			</div>
		</div>
	);
}
