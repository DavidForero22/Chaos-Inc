import { useGameStore } from "../../../store/useGameStore.ts";
import { useGameUIStore } from "../../../store/useGameUIStore.ts";
import { usePlayerIdentity } from "../../../hooks/usePlayerIdentity.ts";

export function PlayerActions() {
	const { myPlayerName } = usePlayerIdentity();

	// --- ESTADO GLOBAL (Servidor) ---
	const me = useGameStore((state) => state.gameData?.me);
	const game = useGameStore((state) => state.gameData?.game);
	const reactToAttack = useGameStore((state) => state.reactToAttack);
	const reactToMultiAttack = useGameStore((state) => state.reactToMultiAttack);
	const endTurn = useGameStore((state) => state.endTurn);
	const discardCards = useGameStore((state) => state.discardCards);
	const discardPerks = useGameStore((state) => state.discardPerks);
	const resolveSabotage = useGameStore((state) => state.resolveSabotage);

	// --- ESTADO LOCAL (UI) ---
	const {
		isDiscardMode,
		cardsToDiscard,
		perksToDiscard,
		setIsDiscardMode,
		clearDiscardSelection,
	} = useGameUIStore();

	if (!me || !game || !myPlayerName) return null;

	// --- VARIABLES DERIVADAS ---
	const isMyTurn = game.current_turn === myPlayerName;
	const isTurnFrozen = game.ending_soon || game.effectively_over;
	const hasPendingAttack = me.combat_state.is_attacking_single;
	const hasPendingMultiAttack = me.combat_state.is_defending_multi;
	const isAttackerWaiting = me.combat_state.is_attacking_multi;
	const hasPendingSabotage =
		!!game.player_pending_sabotage &&
		game.player_pending_sabotage !== myPlayerName;

	const currentCardsCount = me.cards.length;
	const projectedCardsCount = currentCardsCount - cardsToDiscard.length;
	const isOverLimit = currentCardsCount > me.max_hand_size;
	const willBeOverLimit = projectedCardsCount > me.max_hand_size;

	const noSelection =
		cardsToDiscard.length === 0 && perksToDiscard.length === 0;
	const isEvadingSabotage =
		me.conditions.must_discard && cardsToDiscard.length === 0;
	const isConfirmDisabled = willBeOverLimit || noSelection || isEvadingSabotage;

	// --- CONDICIONES DE BOTONES ---
	const canEndTurn =
		isMyTurn &&
		!hasPendingAttack &&
		!isTurnFrozen &&
		!isAttackerWaiting &&
		!isOverLimit &&
		!me.conditions.must_discard &&
		!hasPendingSabotage &&
		!isDiscardMode;

	const canDiscard =
		isMyTurn &&
		!isTurnFrozen &&
		!isAttackerWaiting &&
		!hasPendingAttack &&
		!me.conditions.must_discard &&
		!hasPendingSabotage &&
		currentCardsCount > 0;

	// --- ACCIONES ---
	const handleConfirmDiscard = async () => {
		// Gestionar el descarte de cartas
		if (me.conditions.must_discard) {
			// Si es un sabotaje, debes haber elegido al menos 1 carta
			if (cardsToDiscard.length > 0) {
				await resolveSabotage(cardsToDiscard[0]);
			}
		} else {
			// Si es descarte normal de final de turno
			if (cardsToDiscard.length > 0) {
				await discardCards(cardsToDiscard);
			}
		}

		// Gestionar el descarte de perks
		if (perksToDiscard.length > 0) {
			await discardPerks(perksToDiscard);
		}
		clearDiscardSelection();
	};

	return (
		<div className="ml-auto flex flex-col items-end gap-2 shrink-0">
			{/* Contador de Cartas */}
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

			{/* Botones de Reacción */}
			{me.combat_state.is_defending_single ? (
				<button
					onClick={() => reactToAttack("accept")}
					className="px-4 py-2 rounded font-bold text-sm transition bg-red-600 hover:bg-red-500 text-white"
				>
					Asumir daño
				</button>
			) : hasPendingMultiAttack ? (
				<button
					onClick={() => reactToMultiAttack("accept")}
					className="px-4 py-2 rounded font-bold text-sm transition bg-red-600 hover:bg-red-500 text-white"
				>
					Asumir daño
				</button>
			) : (
				<div className="flex flex-col gap-2 items-end">
					{/* Botones Modo Descarte */}
					{isDiscardMode && !me.conditions.must_discard ? (
						<button
							onClick={clearDiscardSelection}
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

					{/* Botón Principal */}
					{isDiscardMode ? (
						<button
							onClick={handleConfirmDiscard}
							disabled={isConfirmDisabled}
							className={`px-4 py-2 rounded font-bold text-sm transition ${
								!isConfirmDisabled
									? "bg-red-600 hover:bg-red-500 text-white shadow-[0_0_10px_rgba(220,38,38,0.5)]"
									: "bg-gray-700 text-gray-500 cursor-not-allowed"
							}`}
						>
							Confirmar Descarte
						</button>
					) : (
						<button
							onClick={endTurn}
							disabled={!canEndTurn}
							className={`px-4 py-2 rounded font-bold text-sm transition ${
								canEndTurn
									? "bg-purple-600 hover:bg-purple-500 text-white"
									: "bg-gray-700 text-gray-500 cursor-not-allowed"
							}`}
							title={
								isOverLimit
									? "Debes descartar cartas antes de terminar tu turno"
									: "Terminar turno"
							}
						>
							Terminar turno
						</button>
					)}
				</div>
			)}
		</div>
	);
}
