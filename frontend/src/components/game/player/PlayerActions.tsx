// src/components/game/player/PlayerActions.tsx

import { useEffect, useRef } from "react";
import { usePlayerActions } from "../../../hooks/game/usePlayerActions.ts";
import styles from "./PlayerActions.module.css";

export function PlayerActions() {
	const actionLogic = usePlayerActions();

	const prevMustDiscard = useRef(
		actionLogic.me?.conditions.must_discard || false,
	);
	const prevIsOverLimit = useRef(
		actionLogic.me
			? actionLogic.currentCardsCount > actionLogic.me.max_hand_size
			: false,
	);

	const {
		me,
		isDiscardMode,
		isInfoMode,
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
		setIsInfoMode,
		clearDiscardSelection,
		canUseCard,
		handleUseCard,
	} = actionLogic;

	// Sincronización inteligente de limpieza de modos
	useEffect(() => {
		if (!actionLogic.isReady || !actionLogic.me) return;

		const isMustDiscard = actionLogic.me.conditions.must_discard;
		const isOverLimit =
			actionLogic.currentCardsCount > actionLogic.me.max_hand_size;
		const isDefending =
			actionLogic.me.combat_state.is_defending_single ||
			actionLogic.hasPendingMultiAttack;

		// Si entra un ataque
		if (isInfoMode && isDefending) {
			actionLogic.setIsInfoMode?.(false);
		}

		// Actualizar las referencias para el próximo ciclo de React
		prevMustDiscard.current = isMustDiscard;
		prevIsOverLimit.current = isOverLimit;
	}, [
		actionLogic.isReady,
		actionLogic.me?.is_dead,
		actionLogic.me?.conditions.must_discard,
		actionLogic.me?.combat_state.is_defending_single,
		actionLogic.hasPendingMultiAttack,
		actionLogic.currentCardsCount,
		actionLogic.me?.max_hand_size,
		isInfoMode,
		setIsInfoMode,
		isDiscardMode,
		clearDiscardSelection,
	]);

	const isDead = me?.is_dead || false;
	if (!actionLogic.isReady) return null;

	// ¿Deberían estar deshabilitados los botones por el modo Info?
	const isInteractionBlockedByInfo = isInfoMode || isDead;

	return (
		<div className="fixed bottom-4 right-4 z-60 flex flex-col items-end gap-2 pointer-events-auto lg:static lg:w-full lg:flex-row lg:justify-between lg:items-end lg:mb-6 lg:px-2 lg:z-40">
			{/* Contador de Cartas - Solo se ve en PC */}
			<div
				className={`hidden lg:inline-block ${styles.dymoTape} ${(isDiscardMode ? willBeOverLimit : isOverLimit) ? styles.dymoTapeRed : ""}`}
			>
				CARTAS: {isDiscardMode ? projectedCardsCount : currentCardsCount} /{" "}
				{me!.max_hand_size}
			</div>

			{/* Botones de Reacción Defensiva y Acción (Sellos) */}
			<div className="flex flex-col lg:flex-row gap-2 lg:gap-4 items-end lg:items-center">
				{me!.combat_state.is_defending_single ? (
					<button
						onClick={() => {
							reactToAttack?.("accept");
							setIsInfoMode?.(false);
						}}
						disabled={isGlobalLoading}
						className={`${styles.inkStamp} ${styles.stampRed}`}
					>
						ASUMIR DAÑO
					</button>
				) : hasPendingMultiAttack ? (
					<button
						onClick={() => {
							reactToMultiAttack("accept");
							setIsInfoMode(false);
						}}
						disabled={isGlobalLoading}
						className={`${styles.inkStamp} ${styles.stampRed}`}
					>
						ASUMIR DAÑO
					</button>
				) : (
					<>
						{/* --- BOTÓN INFO (SOLO MÓVIL) --- */}
						<button
							onClick={() => setIsInfoMode?.(!isInfoMode)}
							disabled={isGlobalLoading || isDead || isDiscardMode}
							className={`lg:hidden ${styles.inkStamp} ${styles.stampBlue} ${isDiscardMode ? styles.stampDisabled : ""}`}
						>
							{isInfoMode ? "SALIR" : "INFO"}
						</button>

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
								onClick={() => setIsDiscardMode?.(true)}
								disabled={!canDiscard || isInteractionBlockedByInfo}
								className={`${styles.inkStamp} ${styles.stampOrange} ${!canDiscard || isInteractionBlockedByInfo ? styles.stampDisabled : ""}`}
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
								disabled={!canUseCard || isInteractionBlockedByInfo}
								className={`${styles.inkStamp} ${styles.stampBlue} ${!canUseCard || isInteractionBlockedByInfo ? styles.stampDisabled : ""}`}
							>
								USAR CARTA
							</button>
						) : (
							<button
								onClick={endTurn}
								disabled={!canEndTurn || isInteractionBlockedByInfo}
								className={`${styles.inkStamp} ${styles.stampBlack} ${!canEndTurn || isInteractionBlockedByInfo ? styles.stampDisabled : ""}`}
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
