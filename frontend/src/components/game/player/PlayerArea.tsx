import { useDiscardMode } from "../../../hooks/game/useDiscardMode.ts";
import { PlayerHand } from "./PlayerHand.tsx";
import { PlayerStats } from "./PlayerStats.tsx";
import type {
	CardInstance,
	MyData,
	Opponent,
} from "../../../types/live-game.ts";
import { useEffect } from "react";

interface PlayerAreaProps {
	me: MyData;
	isMyTurn: boolean;
	selectedCardId: string | null;
	hasPendingAttack: boolean;
	endingSoon: boolean;
	opponents: Opponent[];
	onCardClick: (card: CardInstance) => void;
	onEndTurn: () => void;
	onReactToAttack: (action: "accept" | "dodge") => void;
	hasPendingMultiAttack: boolean;
	onReactToMultiAttack: (action: "accept" | "dodge", cardId?: string) => void;
	isAttackerWaiting: boolean;
	onDiscardCards?: (cardIds: string[]) => void;
	hasPendingSabotage?: boolean;
}

export function PlayerArea({
	me,
	isMyTurn,
	selectedCardId,
	hasPendingAttack,
	endingSoon,
	opponents,
	onCardClick,
	onEndTurn,
	onReactToAttack,
	hasPendingMultiAttack,
	onReactToMultiAttack,
	isAttackerWaiting,
	onDiscardCards,
	hasPendingSabotage = false,
}: PlayerAreaProps) {
	const {
		isDiscardMode,
		cardsToDiscard,
		setIsDiscardMode,
		toggleCard,
		confirmDiscard,
		cancelDiscard,
	} = useDiscardMode(
		onDiscardCards,
		me.conditions.must_discard ? 1 : undefined,
	);

	const currentCardsCount = me.cards.length;
	const projectedCardsCount = currentCardsCount - cardsToDiscard.length;
	const isOverLimit = currentCardsCount > me.max_hand_size;
	const willBeOverLimit = projectedCardsCount > me.max_hand_size;

	const handleCardClick = (card: CardInstance) => {
		if (isDiscardMode) {
			toggleCard(card.id);
		} else {
			onCardClick(card);
		}
	};

	// Forzar modo descarte cuando el jugador es saboteado
	useEffect(() => {
		if (me.conditions.must_discard && !isDiscardMode) {
			setIsDiscardMode(true);
		}
		if (!me.conditions.must_discard && isDiscardMode) {
			cancelDiscard();
		}
	}, [me.conditions.must_discard]);

	const canEndTurn =
		isMyTurn &&
		selectedCardId === null &&
		!hasPendingAttack &&
		!endingSoon &&
		!isAttackerWaiting &&
		!isOverLimit &&
		!me.conditions.must_discard &&
		!hasPendingSabotage;

	const canDiscard =
		isMyTurn &&
		!endingSoon &&
		!isAttackerWaiting &&
		!hasPendingAttack &&
		!me.conditions.must_discard &&
		!hasPendingSabotage;

	return (
		<div className="mt-4 bg-gray-800 p-6 rounded-xl border border-gray-700 shrink-0 flex gap-6 items-end relative">
			{me.combat_state.is_defending_single &&
				me.combat_state.attacker_name_single && (
					<div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-red-600 text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(220,38,38,0.6)] border border-red-400 animate-pulse z-20 whitespace-nowrap">
						⚠️ ¡{me.combat_state.attacker_name_single} te está intentando
						atacar!
					</div>
				)}

			{me.combat_state.is_defending_multi &&
				me.combat_state.attacker_name_multi && (
					<div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-red-600 text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(220,38,38,0.6)] border border-red-400 animate-pulse z-20 whitespace-nowrap">
						⚠️ ¡{me.combat_state.attacker_name_multi} ha lanzado un ataque
						global!
					</div>
				)}

			{me.conditions.skip_next_turn && (
				<div className="absolute -top-4 left-4 bg-orange-600 text-white text-xs font-bold px-3 py-1 rounded shadow-lg border border-orange-400 animate-pulse">
					⚠️ Penalización: Perderás tu próximo turno por inactividad.
				</div>
			)}

			{me.conditions.must_discard && (
				<div className="absolute -top-4 left-4 bg-red-700 text-white text-xs font-bold px-3 py-1 rounded shadow-lg border border-red-500 animate-pulse">
					⚠️{" "}
					{me.conditions.must_discard_by
						? `${me.conditions.must_discard_by} te ha saboteado.`
						: "Has sido saboteado."}{" "}
					Debes descartar una carta antes de continuar.
				</div>
			)}

			<PlayerStats me={me} />

			<PlayerHand
				me={me}
				isMyTurn={isMyTurn}
				selectedCardId={selectedCardId}
				onCardClick={handleCardClick}
				incomingAttack={me.combat_state.is_defending_single}
				opponents={opponents}
				hasPendingAttack={hasPendingAttack}
				hasPendingMultiAttack={hasPendingMultiAttack}
				isAttackerWaiting={isAttackerWaiting}
				isDiscardMode={isDiscardMode}
				cardsToDiscard={cardsToDiscard}
				hasPendingSabotage={hasPendingSabotage}
			/>

			<div className="ml-auto flex flex-col items-end gap-2">
				<div
					className={`text-sm font-mono font-bold px-2 py-1 rounded ${
						isDiscardMode
							? willBeOverLimit
								? "bg-red-900/50 text-red-400 border border-red-700"
								: "bg-green-900/50 text-green-400 border border-green-700"
							: isOverLimit
								? "bg-red-900/50 text-red-400 border border-red-700"
								: "bg-gray-700 text-gray-300"
					}`}
				>
					Cartas: {isDiscardMode ? projectedCardsCount : currentCardsCount} /{" "}
					{me.max_hand_size}
				</div>

				{me.combat_state.is_defending_single ? (
					<button
						onClick={() => onReactToAttack("accept")}
						className="px-4 py-2 rounded font-bold text-sm transition bg-red-600 hover:bg-red-500 text-white"
					>
						Asumir daño
					</button>
				) : hasPendingMultiAttack ? (
					<button
						onClick={() => onReactToMultiAttack("accept")}
						className="px-4 py-2 rounded font-bold text-sm transition bg-red-600 hover:bg-red-500 text-white"
					>
						Asumir daño
					</button>
				) : (
					<div className="flex flex-col gap-2 items-end">
						{/* DESCARTE — encima de terminar turno */}
						{isDiscardMode && !me.conditions.must_discard ? (
							<button
								onClick={cancelDiscard}
								className="px-4 py-2 rounded font-bold text-sm transition bg-orange-600 hover:bg-orange-500 text-white"
							>
								Cancelar
							</button>
						) : !isDiscardMode ? (
							<button
								onClick={() => setIsDiscardMode(true)}
								disabled={!canDiscard}
								className={`px-4 py-2 rounded font-bold text-sm transition ${
									canDiscard
										? "bg-orange-600 hover:bg-orange-500 text-white"
										: "bg-gray-700 text-gray-500 cursor-not-allowed"
								}`}
							>
								Descartar
							</button>
						) : null}

						{/* TERMINAR TURNO — se transforma en Confirmar Descarte */}
						{isDiscardMode ? (
							<button
								onClick={confirmDiscard}
								disabled={cardsToDiscard.length === 0 || willBeOverLimit}
								className={`px-4 py-2 rounded font-bold text-sm transition ${
									cardsToDiscard.length > 0 && !willBeOverLimit
										? "bg-red-600 hover:bg-red-500 text-white shadow-[0_0_10px_rgba(220,38,38,0.5)]"
										: "bg-gray-700 text-gray-500 cursor-not-allowed"
								}`}
							>
								Confirmar Descarte
							</button>
						) : (
							<button
								onClick={onEndTurn}
								disabled={!canEndTurn}
								className={`px-4 py-2 rounded font-bold text-sm transition ${
									canEndTurn
										? "bg-purple-600 hover:bg-purple-500 text-white"
										: "bg-gray-700 text-gray-500 cursor-not-allowed"
								}`}
								title={
									isOverLimit
										? "Debes descartar cartas antes de terminar tu turno"
										: ""
								}
							>
								Terminar turno
							</button>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
