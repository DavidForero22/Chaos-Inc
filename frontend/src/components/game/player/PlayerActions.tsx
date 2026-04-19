// frontend/src/components/game/player/PlayerActions.tsx
import { usePlayerActions } from "../../../hooks/game/usePlayerActions.ts";
import styles from "./PlayerActions.module.css";

export function PlayerActions() {
	const actionLogic = usePlayerActions();

	// Si los datos no han cargado, no renderizamos nada
	if (!actionLogic.isReady) return null;

	const {
		me,
		isDiscardMode,
		currentCardsCount,
		projectedCardsCount,
		willBeOverLimit,
		isOverLimit,
		canEndTurn,
		canDiscard,
		isConfirmDisabled,
		hasPendingMultiAttack,
		isGlobalLoading,
		handleConfirmDiscard,
		reactToAttack,
		reactToMultiAttack,
		endTurn,
		setIsDiscardMode,
		clearDiscardSelection,
		canUseCard,
		handleUseCard,
	} = actionLogic;

	return (
		<div className="w-full flex justify-between items-end mb-6 px-2 shrink-0 z-40">
			{/* Contador de Cartas (Cinta Dymo) */}
			<div
				className={`${styles.dymoTape} ${
					(isDiscardMode ? willBeOverLimit : isOverLimit)
						? styles.dymoTapeRed
						: ""
				}`}
				title="Documentos en posesión"
			>
				CARTAS: {isDiscardMode ? projectedCardsCount : currentCardsCount} /{" "}
				{me!.max_hand_size}
			</div>

			{/* Botones de Reacción Defensiva y Acción (Sellos) */}
			<div className="flex gap-4 items-center">
				{me!.combat_state.is_defending_single ? (
					<button
						onClick={() => reactToAttack("accept")}
						disabled={isGlobalLoading}
						className={`${styles.inkStamp} ${styles.stampRed}`}
					>
						ASUMIR DAÑO
					</button>
				) : hasPendingMultiAttack ? (
					<button
						onClick={() => reactToMultiAttack("accept")}
						disabled={isGlobalLoading}
						className={`${styles.inkStamp} ${styles.stampRed}`}
					>
						ASUMIR DAÑO
					</button>
				) : (
					<>
						{/* Botones Modo Descarte */}
						{isDiscardMode && !me!.conditions.must_discard ? (
							<button
								onClick={clearDiscardSelection}
								disabled={isGlobalLoading}
								className={`${styles.inkStamp} ${styles.stampOrange}`}
							>
								CANCELAR
							</button>
						) : !isDiscardMode ? (
							<button
								onClick={() => setIsDiscardMode(true)}
								disabled={!canDiscard}
								className={`${styles.inkStamp} ${styles.stampOrange} ${!canDiscard ? styles.stampDisabled : ""}`}
							>
								DESCARTAR
							</button>
						) : null}

						{/* Botón Principal (Confirmar Descarte, Usar carta o Terminar Turno) */}
						{isDiscardMode ? (
							<button
								onClick={handleConfirmDiscard}
								disabled={isConfirmDisabled}
								className={`${styles.inkStamp} ${styles.stampRed} ${isConfirmDisabled ? styles.stampDisabled : ""}`}
							>
								{isConfirmDisabled ? "DESCARTANDO..." : "CONFIRMAR DESCARTE"}
							</button>
						) : canUseCard ? (
							<button
								onClick={handleUseCard}
								disabled={!canUseCard}
								className={`${styles.inkStamp} ${styles.stampBlue}`}
							>
								USAR CARTA
							</button>
						) : (
							<button
								onClick={endTurn}
								disabled={!canEndTurn}
								className={`${styles.inkStamp} ${styles.stampBlack} ${!canEndTurn ? styles.stampDisabled : ""}`}
								title={
									isOverLimit
										? "Debes descartar cartas antes de terminar tu turno"
										: "Terminar turno"
								}
							>
								TERMINAR TURNO
							</button>
						)}
					</>
				)}
			</div>
		</div>
	);
}
