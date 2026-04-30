// frontend/src/components/game/player/PlayerActions.tsx

import { useEffect } from "react";
import { usePlayerActions } from "../../../hooks/game/usePlayerActions.ts";
import styles from "./PlayerActions.module.css";

export function PlayerActions() {
	const actionLogic = usePlayerActions();

	// Sincronización del "Auto-Descarte" por timeout
	useEffect(() => {
		if (!actionLogic.isReady || !actionLogic.me) return;

		const { me, isDiscardMode, currentCardsCount, clearDiscardSelection } =
			actionLogic;

		// Si está en modo descarte, pero el servidor ya quitó la obligación
		// y tampoco se pasó del límite de cartas en mano, limpiar la selección y cerrar
		if (
			isDiscardMode &&
			!me.conditions.must_discard &&
			currentCardsCount <= me.max_hand_size
		) {
			clearDiscardSelection();
		}
	}, [
		actionLogic.isReady,
		actionLogic.me?.conditions.must_discard,
		actionLogic.currentCardsCount,
		actionLogic.me?.max_hand_size,
		actionLogic.isDiscardMode,
		actionLogic.clearDiscardSelection,
	]);

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
		/* RESPONSIVE MÁGICO: 
           - Móvil: fixed, bottom-4, right-4 (Flotante)
           - PC (lg): static, justify-between, mb-6 (Vuelve a su sitio original dentro de la carpeta)
        */
		<div className="fixed bottom-4 right-4 z-60 flex flex-col items-end gap-2 pointer-events-auto lg:static lg:w-full lg:flex-row lg:justify-between lg:items-end lg:mb-6 lg:px-2 lg:z-40">
			{/* Contador de Cartas (Cinta Dymo) - Solo se ve en PC */}
			<div
				className={`hidden lg:inline-block ${styles.dymoTape} ${
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
			<div className="flex flex-col lg:flex-row gap-2 lg:gap-4 items-end lg:items-center">
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
								{isGlobalLoading ? "DESCARTANDO..." : "CONFIRMAR"}
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
