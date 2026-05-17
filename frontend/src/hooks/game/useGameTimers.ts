// src/hooks/game/useGameTimers.ts

import { useState, useEffect, useRef } from "react";
import { logWithTime } from "../../utils/logger.ts";
import { useGameStore } from "../../store/game/useGameStore.ts";
import { useTimerStore } from "../../store/game/useTimerStore.ts";
import { useLoadingStore } from "../../store/ui/useLoadingStore.ts";
import { useAuth } from "../useAuth.ts";
import { useGameUIStore } from "../../store/game/useGameUIStore.ts";
import { useGameActions } from "../../store/game/useGameActions.ts";

export function useGameTimers() {
	const { id: myId } = useAuth();

	const gameData = useGameStore((state) => state.gameData);
	const reactToMultiAttack = useGameActions((state) => state.reactToMultiAttack);

	// Traer solo los setters de Zustand
	const setMultiAttackSecondsLeft = useTimerStore(
		(state) => state.setMultiAttackSecondsLeft,
	);
	const setSabotageSecondsLeft = useTimerStore(
		(state) => state.setSabotageSecondsLeft,
	);
	const setSingleAttackSecondsLeft = useTimerStore(
		(state) => state.setSingleAttackSecondsLeft,
	);
	const setLuckChallengeSecondsLeft = useTimerStore(
		(state) => state.setLuckChallengeSecondsLeft,
	);

	const bossDisconnected = gameData?.game?.boss_disconnected;
	const actingBossDisconnected = gameData?.game?.acting_boss_disconnected;
	const endingSoon = gameData?.game?.ending_soon;
	const hasActingBoss = gameData?.game?.has_acting_boss;

	// Estados de ataque
	const hasPendingMultiAttack =
		gameData?.me?.combat_state.is_defending_multi ?? false;
	const hasPendingSabotage = gameData?.me?.conditions.must_discard ?? false;
	const hasIncomingAttack =
		gameData?.me?.combat_state.is_defending_single ?? false;
	const hasLuckChallenge = !!gameData?.me?.luck_challenge;

	// --- Variables Clave del Turno ---
	const turnExpiresAt = gameData?.game?.turn_expires_at;
	const turnRemaining = gameData?.game?.turn_remaining;
	const currentTurn = gameData?.game?.current_turn;

	// Verificar si es el turno del jugador
	const isMyTurn = String(currentTurn) === String(myId);

	// Identificar si el jugador es el que está esperando (Pausa de turno)
	const isSomeoneWaitingForReaction =
		gameData?.game?.pending_single_attack_target !== null ||
		(gameData?.game?.pending_multi_attack_targets &&
			gameData.game.pending_multi_attack_targets.length > 0) ||
		gameData?.game?.player_pending_sabotage !== null;

	const gameOver = useGameStore((state) => state.gameOver);

	const isGlobalPause =
		bossDisconnected || actingBossDisconnected || endingSoon;
	// Si expires_at es 0, también considerarlo una pausa
	const isTurnPaused =
		isSomeoneWaitingForReaction || isGlobalPause || turnExpiresAt === 0;

	const [turnTimeLeft, setTurnTimeLeft] = useState<number | null>(null);

	// --- COUNTDOWN INMUNE A DESFASES DE RELOJ ---
	useEffect(() => {
		if (gameOver) {
			setTurnTimeLeft(null);
			logWithTime(
				"useGameTimers.ts - Partida finalizada. Matando reloj local.",
			);
			return;
		}

		// Si no hay tiempo restante, matar el reloj
		if (isTurnPaused || turnRemaining === undefined || turnRemaining === null) {
			setTurnTimeLeft(null);
			return;
		}

		let didTriggerLoader = false;
		const loadingStore = useLoadingStore.getState();

		// ---------------------------------------------------------
		// MAGIA ANTI-DESFASE: Crear una caducidad 100% LOCAL
		// Sumar los segundos que dijo el servidor al reloj local.
		// ---------------------------------------------------------
		const localExpireMs = Date.now() + turnRemaining * 1000;

		const calculateTimeLeft = () => {
			const secondsLeft = Math.floor((localExpireMs - Date.now()) / 1000);
			return secondsLeft > 0 ? secondsLeft : 0;
		};

		const initialTime = calculateTimeLeft();
		setTurnTimeLeft(initialTime);

		const interval = setInterval(() => {
			const currentSecondsLeft = calculateTimeLeft();

			setTurnTimeLeft(currentSecondsLeft);

			if (currentSecondsLeft <= 0) {
				clearInterval(interval);

				if (isMyTurn && !didTriggerLoader) {
					loadingStore.startLoading("Procesando fin de turno...");
					didTriggerLoader = true;
				}
			}
		}, 1000);

		return () => {
			clearInterval(interval);
			if (didTriggerLoader) {
				loadingStore.stopLoading();
			}
		};
	}, [isMyTurn, turnExpiresAt, isTurnPaused, gameOver, currentTurn]);

	// --- Banner de herencia ---
	const [showInheritanceBanner, setShowInheritanceBanner] = useState(false);
	const prevHasActingBossRef = useRef(hasActingBoss);
	const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		const isActingBossNow = Boolean(hasActingBoss);
		const wasActingBossBefore = Boolean(prevHasActingBossRef.current);
		prevHasActingBossRef.current = isActingBossNow;

		if (isActingBossNow && !wasActingBossBefore && !endingSoon) {
			logWithTime("useGameTimers.ts - Mostrando banner de herencia.");
			setShowInheritanceBanner(true);
			if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
			bannerTimerRef.current = setTimeout(
				() => setShowInheritanceBanner(false),
				4500,
			);
		}

		return () => {
			if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
		};
	}, [hasActingBoss, endingSoon]);

	// --- Countdown ataque masivo (15s para objetivos) ---
	useEffect(() => {
		if (!hasPendingMultiAttack) return; // Solo se activa si eres el objetivo

		let secondsLeft = 15;
		setMultiAttackSecondsLeft(secondsLeft);
		let didTriggerLoader = false;

		const interval = setInterval(() => {
			secondsLeft -= 1;

			if (secondsLeft <= 0) {
				clearInterval(interval);
				setMultiAttackSecondsLeft(null);

				if (!didTriggerLoader) {
					useLoadingStore.getState().startLoading("Procesando impacto...");
					didTriggerLoader = true;
					// Auto-aceptar si se acaba el tiempo
					reactToMultiAttack("accept").catch(() => {});
				}
			} else {
				setMultiAttackSecondsLeft(secondsLeft);
			}
		}, 1000);

		// La función de limpieza se encarga de borrar el loader cuando el backend responda
		return () => {
			clearInterval(interval);
			setMultiAttackSecondsLeft(null);
			if (didTriggerLoader) {
				useLoadingStore.getState().stopLoading();
			}
		};
	}, [hasPendingMultiAttack, reactToMultiAttack, setMultiAttackSecondsLeft]);

	// --- Countdown Sabotaje (15s para descartar) ---
	const prevHasPendingSabotageRef = useRef(false);
	const sabotageTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const sabotageLoaderRef = useRef(false);

	useEffect(() => {
		const isTarget = hasPendingSabotage;
		const wasTarget = prevHasPendingSabotageRef.current;
		prevHasPendingSabotageRef.current = isTarget;

		if (isTarget && !wasTarget) {
			setSabotageSecondsLeft(15);
			sabotageLoaderRef.current = false;
			if (sabotageTimerRef.current) clearInterval(sabotageTimerRef.current);

			sabotageTimerRef.current = setInterval(() => {
				setSabotageSecondsLeft((prev) => {
					if (prev === null || prev <= 1) {
						clearInterval(sabotageTimerRef.current!);
						sabotageTimerRef.current = null;

						if (!sabotageLoaderRef.current) {
							// Limpiar UI
							useGameUIStore.getState().setIsDiscardMode(false);
							useGameUIStore.getState().clearDiscardSelection();
							// Poner Loader
							useLoadingStore.getState().startLoading("Procesando descarte...");
							sabotageLoaderRef.current = true;
						}
						return null;
					}
					return prev - 1;
				});
			}, 1000);
		}

		// Se quita el modo sabotaje desde el servidor
		if (!isTarget && wasTarget) {
			if (sabotageTimerRef.current) clearInterval(sabotageTimerRef.current);
			setSabotageSecondsLeft(null);
			useGameUIStore.getState().clearDiscardSelection();

			// Apagar el loader porque ya se resolvió
			if (sabotageLoaderRef.current) {
				useLoadingStore.getState().stopLoading();
				sabotageLoaderRef.current = false;
			}
		}

		return () => {
			if (sabotageTimerRef.current) {
				clearInterval(sabotageTimerRef.current);
				sabotageTimerRef.current = null;
				// Si el intervalo se canceló antes de llegar a 0, limpiar UI aquí también
				useGameUIStore.getState().clearDiscardSelection();
			}
			if (sabotageLoaderRef.current) {
				useLoadingStore.getState().stopLoading();
				sabotageLoaderRef.current = false;
			}
		};
	}, [hasPendingSabotage, setSabotageSecondsLeft]);

	// --- Countdown Ataque Simple (15s) ---
	useEffect(() => {
		if (!hasIncomingAttack) return;

		let secondsLeft = 15;
		setSingleAttackSecondsLeft(secondsLeft);
		let didTriggerLoader = false;

		const interval = setInterval(() => {
			secondsLeft -= 1;

			if (secondsLeft <= 0) {
				clearInterval(interval);
				setSingleAttackSecondsLeft(null);

				if (!didTriggerLoader) {
					useLoadingStore.getState().startLoading("Procesando ataque...");
					didTriggerLoader = true;
				}
			} else {
				setSingleAttackSecondsLeft(secondsLeft);
			}
		}, 1000);

		return () => {
			clearInterval(interval);
			setSingleAttackSecondsLeft(null);
			if (didTriggerLoader) {
				useLoadingStore.getState().stopLoading();
			}
		};
	}, [hasIncomingAttack, setSingleAttackSecondsLeft]);

	// --- Countdown Prueba de Suerte (15s) ---
	useEffect(() => {
		if (!hasLuckChallenge) return;

		let secondsLeft = 15;
		setLuckChallengeSecondsLeft(secondsLeft);
		let didTriggerLoader = false;

		const interval = setInterval(() => {
			secondsLeft -= 1;

			if (secondsLeft <= 0) {
				clearInterval(interval);
				setLuckChallengeSecondsLeft(null);

				if (!didTriggerLoader) {
					useLoadingStore.getState().startLoading("Resolviendo desafío...");
					didTriggerLoader = true;
				}
			} else {
				setLuckChallengeSecondsLeft(secondsLeft);
			}
		}, 1000);

		return () => {
			clearInterval(interval);
			setLuckChallengeSecondsLeft(null);
			if (didTriggerLoader) {
				useLoadingStore.getState().stopLoading();
			}
		};
	}, [hasLuckChallenge, setLuckChallengeSecondsLeft]);

	return {
		showBossWaiting: Boolean(bossDisconnected),
		showActingBossWaiting: Boolean(actingBossDisconnected),
		showEndingWaiting: Boolean(endingSoon),
		showInheritanceBanner,
		turnTimeLeft,
		isTurnPaused,
	};
}
