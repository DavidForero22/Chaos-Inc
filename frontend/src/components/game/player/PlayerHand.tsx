import { Card } from "../ui/Card.tsx";
import { useGameStore } from "../../../store/useGameStore.ts";
import { useGameUIStore } from "../../../store/useGameUIStore.ts";
import { usePlayerIdentity } from "../../../hooks/usePlayerIdentity.ts";
import type { CardInstance } from "../../../types/live-game.ts";

export function PlayerHand() {
	const { myPlayerName } = usePlayerIdentity();

	// --- ESTADO GLOBAL (Servidor) ---
	const me = useGameStore((state) => state.gameData?.me);
	const game = useGameStore((state) => state.gameData?.game);
	const reactToAttack = useGameStore((state) => state.reactToAttack);
	const reactToMultiAttack = useGameStore((state) => state.reactToMultiAttack);
	const playTurn = useGameStore((state) => state.playTurn);

	// --- ESTADO LOCAL (UI) ---
	const {
		isDiscardMode,
		cardsToDiscard,
		toggleDiscardCard,
		selectedCardId,
		setSelectedCardId,
	} = useGameUIStore();

	if (!me || !game || !myPlayerName) return null;

	const opponents = game.opponents;
	const myRange = me.perks.vision_range ?? 1;
	const isMyTurn = game.current_turn === myPlayerName;
	const incomingAttack = me.combat_state.is_defending_single;
	const hasPendingMultiAttack = me.combat_state.is_defending_multi;
	const hasPendingAttack = me.combat_state.is_attacking_single;
	const isAttackerWaiting = me.combat_state.is_attacking_multi;
	const hasPendingSabotage =
		!!game.player_pending_sabotage &&
		game.player_pending_sabotage !== myPlayerName;
	const hasLuckChallenge = isMyTurn && !!me.luck_challenge;

	// --- LÓGICA DE CONDICIONES GLOBALES ---
	const anyOpponentHasCards = opponents.some(
		(o) => o.cards_count > 0 && o.is_online,
	);

	const anyoneHasStress =
		opponents.some((o) => !o.is_dead && o.stress > 0) || me.stress > 0;

	const isAnyOpponentInRange = opponents.some(
		(o) => !o.is_dead && o.is_online && o.distance <= myRange,
	);

	// --- MANEJADOR DE CLIC CENTRALIZADO ---
	const handleCardClick = (card: CardInstance) => {
		if (isDiscardMode) {
			const maxCards = me.conditions.must_discard ? 1 : undefined;
			toggleDiscardCard(card.id, maxCards);
			return;
		}

		if ((incomingAttack || hasPendingMultiAttack) && card.type === 3) {
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

		if (card.type === 10 && me.perks.vision_bonus < 2) {
			return playTurn(card.id, myPlayerName);
		}

		// Si es una carta de targeteo a otro, seleccionarla
		setSelectedCardId(selectedCardId === card.id ? null : card.id);
	};

	return (
		<div className="flex-1 min-w-0 border-l border-gray-700 pl-6 flex flex-col">
			<p className="text-xs text-gray-500 uppercase font-bold mb-3">Tu Mano</p>

			{/* Contenedor de cartas con altura mínima fija */}
			<div className="w-full flex gap-3 overflow-x-auto no-scrollbar py-2 pt-6 min-h-36">
				{/* ESTADO VACÍO */}
				{me.cards.length === 0 ? (
					<div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-700 rounded-xl text-gray-500 opacity-50">
						<p className="italic text-sm">Sin cartas en la mano</p>
					</div>
				) : (
					/* RENDERIZADO NORMAL DE CARTAS */
					me.cards.map((card) => {
						const isSelected = selectedCardId === card.id;
						const isMarkedForDiscard = cardsToDiscard.includes(card.id);

						const isHealDisabled = card.type === 2 && me.stress <= 0;
						const isAttackDisabled =
							card.type === 1 &&
							(me.turn_limits.single_attack_used || !isAnyOpponentInRange);
						const isAttackAllDisabled =
							card.type === 7 && me.turn_limits.multi_attack_used;
						const isDodgeDisabled =
							card.type === 3 && !incomingAttack && !hasPendingMultiAttack;
						const isStealDisabled = card.type === 4 && !anyOpponentHasCards;
						const isShieldDisabled = card.type === 5 && me.perks.has_shield;
						const isHealAllDisabled = card.type === 8 && !anyoneHasStress;
						const isSabotageDisabled =
							card.type === 9 &&
							!opponents.some(
								(o) => !o.is_dead && o.is_online && o.cards_count > 0,
							);
						const isBlockDisabled =
							card.type === 6 &&
							!opponents.some((o) => {
								const isBlocked =
									o.conditions?.is_blocked ?? (o as any).is_blocked;
								return !o.is_dead && o.is_online && !isBlocked;
							});
						const isVisionDisabled =
							card.type === 10 && me.perks.vision_bonus >= 2;

						const isDisabled =
							isHealDisabled ||
							isAttackDisabled ||
							isDodgeDisabled ||
							isStealDisabled ||
							isShieldDisabled ||
							isBlockDisabled ||
							isHealAllDisabled ||
							isAttackAllDisabled ||
							isSabotageDisabled ||
							isVisionDisabled;

						const canUseDodgeNow =
							(incomingAttack || hasPendingMultiAttack) && card.type === 3;

						const isSelectable = isDiscardMode
							? true
							: (isMyTurn &&
									!isDisabled &&
									!hasPendingAttack &&
									!isAttackerWaiting &&
									!hasPendingSabotage) ||
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
