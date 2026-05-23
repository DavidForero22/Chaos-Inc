// src/components/game/player/PlayerActions.tsx
// Accesibilidad comprobada: SI

import { useEffect, useRef } from "react";
import { usePlayerActions } from "../../../hooks/game/usePlayerActions.ts";
import styles from "./PlayerActions.module.css";
import { useGameUIStore } from "../../../store/game/useGameUIStore.ts";

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

	const selectedCardId = useGameUIStore((state) => state.selectedCardId);
	const selectedCard = me?.cards.find((c) => c.id === selectedCardId);
	const isTargetingMode = selectedCard?.target === "opponent";
	const hasSelectedCard = selectedCardId !== null;

	// Sincronización inteligente de limpieza de modos
	useEffect(() => {
		if (!actionLogic.isReady || !actionLogic.me) return;

		const isMustDiscard = actionLogic.me.conditions.must_discard;
		const isCurrentlyOverLimit =
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
		prevIsOverLimit.current = isCurrentlyOverLimit;
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
	const isInfoDisabled =
		isGlobalLoading || isDead || isDiscardMode || hasSelectedCard;

	if (!actionLogic.isReady) return null;

	// ¿Deberían estar deshabilitados los botones por el modo Info?
	const isInteractionBlockedByInfo = isInfoMode || isDead;
	const isCurrentlyOverLimit = isDiscardMode ? willBeOverLimit : isOverLimit;
	console.log("canDiscard: ", canDiscard);
	console.log("isInteractionBlockedByInfo: ", isInteractionBlockedByInfo);
	console.log("hasSelectedCard: ", hasSelectedCard);
	const isDiscardDisabled =
		!canDiscard || isInteractionBlockedByInfo || hasSelectedCard;

	return (
		<section
			aria-label="Controles principales del turno"
			className="fixed bottom-4 right-4 z-60 flex flex-col items-end gap-2 pointer-events-auto lg:static lg:w-full lg:flex-row lg:justify-between lg:items-end lg:mb-6 lg:px-2 lg:z-40"
		>
			{/* Contador de Cartas - Solo se ve en PC */}
			<div
				role="status"
				aria-live="polite"
				className={`hidden lg:inline-block ${styles.dymoTape} ${isCurrentlyOverLimit ? styles.dymoTapeRed : ""}`}
			>
				{/* Texto exclusivo para lector de pantalla que explica el error visual (color rojo) */}
				<span className="sr-only">
					{isCurrentlyOverLimit ? "Límite excedido. " : ""}
					Tienes
				</span>
				<span aria-hidden="true">CARTAS: </span>
				{isDiscardMode ? projectedCardsCount : currentCardsCount} /{" "}
				{me!.max_hand_size}
				<span className="sr-only"> cartas en mano.</span>
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
						aria-busy={isGlobalLoading}
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
						aria-busy={isGlobalLoading}
						className={`${styles.inkStamp} ${styles.stampRed}`}
					>
						ASUMIR DAÑO
					</button>
				) : (
					<>
						{/* --- BOTÓN INFO --- */}
						<button
							tabIndex={isTargetingMode ? -1 : 0}
							onClick={() => {
								if (isInfoDisabled) return;
								setIsInfoMode?.(!isInfoMode);
							}}
							disabled={isInfoDisabled}
							aria-expanded={isInfoMode}
							aria-label={
								isInfoMode
									? "Cerrar panel de información"
									: "Abrir panel de información"
							}
							className={`${styles.inkStamp} ${styles.stampBlue} ${
								isInfoDisabled ? styles.stampDisabled : ""
							}`}
						>
							{isInfoMode ? "SALIR" : "INFO"}
						</button>

						{/* Botones Modo Descarte */}
						{isDiscardMode && !me!.conditions.must_discard ? (
							<button
								tabIndex={isTargetingMode ? -1 : 0}
								onClick={clearDiscardSelection}
								disabled={isGlobalLoading}
								className={`${styles.inkStamp} ${styles.stampOrange}`}
							>
								CANCELAR
							</button>
						) : !isDiscardMode ? (
							<button
								tabIndex={isTargetingMode ? -1 : 0}
								onClick={() => setIsDiscardMode?.(true)}
								disabled={isDiscardDisabled}
								className={`${styles.inkStamp} ${styles.stampOrange} ${!canDiscard || isInteractionBlockedByInfo ? styles.stampDisabled : ""}`}
							>
								DESCARTAR
							</button>
						) : null}

						{/* Botón Principal (Confirmar Descarte, Usar carta o Terminar Turno) */}
						{isDiscardMode ? (
							<button
								tabIndex={isTargetingMode ? -1 : 0}
								onClick={handleConfirmDiscard}
								disabled={isConfirmDisabled}
								aria-busy={isGlobalLoading}
								className={`${styles.inkStamp} ${styles.stampRed} ${isConfirmDisabled ? styles.stampDisabled : ""}`}
							>
								{isGlobalLoading ? "DESCARTANDO..." : "CONFIRMAR"}
							</button>
						) : canUseCard ? (
							<button
								tabIndex={isTargetingMode ? -1 : 0}
								onClick={handleUseCard}
								disabled={!canUseCard || isInteractionBlockedByInfo}
								className={`${styles.inkStamp} ${styles.stampBlue} ${!canUseCard || isInteractionBlockedByInfo ? styles.stampDisabled : ""}`}
							>
								USAR CARTA
							</button>
						) : (
							<button
								onClick={endTurn}
								tabIndex={isTargetingMode ? -1 : 0}
								disabled={!canEndTurn || isInteractionBlockedByInfo}
								aria-label={
									isOverLimit
										? "No puedes terminar tu turno. Debes descartar cartas primero."
										: "Terminar turno"
								}
								title={
									isOverLimit
										? "Debes descartar cartas antes de terminar tu turno"
										: "Terminar turno"
								}
								className={`${styles.inkStamp} ${styles.stampBlack} ${!canEndTurn || isInteractionBlockedByInfo ? styles.stampDisabled : ""}`}
							>
								TERMINAR TURNO
							</button>
						)}
					</>
				)}
			</div>
		</section>
	);
}
