// src/hooks/game/useGameTimers.ts

import { useState, useEffect, useRef } from "react";
import { logWithTime } from "../../utils/logger.ts";
import { useGameStore } from "../../store/useGameStore.ts";
import { useTimerStore } from "../../store/useTimerStore.ts";
import { useLoadingStore } from "../../store/useLoadingStore";

export function useGameTimers() {
	const gameData = useGameStore((state) => state.gameData);
	const reactToMultiAttack = useGameStore((state) => state.reactToMultiAttack);

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
	const myName = gameData?.me?.name;

	// Verificar si es el turno del jugador
	const isMyTurn = currentTurn === myName;
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

		if (initialTime > 0) {
			logWithTime(
				`useGameTimers.ts - Iniciando reloj para ${currentTurn}. Segundos reales: ${initialTime}`,
			);
		}

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
	const prevHasPendingMultiRef = useRef(false);
	const multiAttackTimerRef = useRef<ReturnType<typeof setInterval> | null>(
		null,
	);

	useEffect(() => {
		const isTarget = hasPendingMultiAttack;
		const wasTarget = prevHasPendingMultiRef.current;
		prevHasPendingMultiRef.current = isTarget;

		if (isTarget && !wasTarget) {
			setMultiAttackSecondsLeft(15);
			if (multiAttackTimerRef.current)
				clearInterval(multiAttackTimerRef.current);

			multiAttackTimerRef.current = setInterval(() => {
				setMultiAttackSecondsLeft((prev) => {
					if (prev === null || prev <= 1) {
						clearInterval(multiAttackTimerRef.current!);
						multiAttackTimerRef.current = null;
						reactToMultiAttack("accept").catch(() => {});
						return null;
					}
					return prev - 1;
				});
			}, 1000);
		}

		if (!isTarget && wasTarget) {
			if (multiAttackTimerRef.current) {
				clearInterval(multiAttackTimerRef.current);
				multiAttackTimerRef.current = null;
			}
			setMultiAttackSecondsLeft(null);
		}

		return () => {
			if (multiAttackTimerRef.current)
				clearInterval(multiAttackTimerRef.current);
		};
	}, [hasPendingMultiAttack, reactToMultiAttack, setMultiAttackSecondsLeft]);

	// --- Countdown Sabotaje (15s para descartar) ---
	const prevHasPendingSabotageRef = useRef(false);
	const sabotageTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

	useEffect(() => {
		const isTarget = hasPendingSabotage;
		const wasTarget = prevHasPendingSabotageRef.current;
		prevHasPendingSabotageRef.current = isTarget;

		if (isTarget && !wasTarget) {
			setSabotageSecondsLeft(15);
			if (sabotageTimerRef.current) clearInterval(sabotageTimerRef.current);

			sabotageTimerRef.current = setInterval(() => {
				setSabotageSecondsLeft((prev) => {
					if (prev === null || prev <= 1) {
						clearInterval(sabotageTimerRef.current!);
						sabotageTimerRef.current = null;
						return null;
					}
					return prev - 1;
				});
			}, 1000);
		}

		if (!isTarget && wasTarget) {
			if (sabotageTimerRef.current) {
				clearInterval(sabotageTimerRef.current);
				sabotageTimerRef.current = null;
			}
			setSabotageSecondsLeft(null);
		}

		return () => {
			if (sabotageTimerRef.current) clearInterval(sabotageTimerRef.current);
		};
	}, [hasPendingSabotage, setSabotageSecondsLeft]);

	// --- Countdown Ataque Simple (15s) ---
	const prevHasIncomingAttackRef = useRef(false);
	const singleAttackTimerRef = useRef<ReturnType<typeof setInterval> | null>(
		null,
	);

	useEffect(() => {
		const isTarget = hasIncomingAttack;
		const wasTarget = prevHasIncomingAttackRef.current;
		prevHasIncomingAttackRef.current = isTarget;

		if (isTarget && !wasTarget) {
			setSingleAttackSecondsLeft(15);
			if (singleAttackTimerRef.current)
				clearInterval(singleAttackTimerRef.current);

			singleAttackTimerRef.current = setInterval(() => {
				setSingleAttackSecondsLeft((prev) => {
					if (prev === null || prev <= 1) {
						clearInterval(singleAttackTimerRef.current!);
						singleAttackTimerRef.current = null;
						return null;
					}
					return prev - 1;
				});
			}, 1000);
		}

		if (!isTarget && wasTarget) {
			if (singleAttackTimerRef.current) {
				clearInterval(singleAttackTimerRef.current);
				singleAttackTimerRef.current = null;
			}
			setSingleAttackSecondsLeft(null);
		}

		return () => {
			if (singleAttackTimerRef.current)
				clearInterval(singleAttackTimerRef.current);
		};
	}, [hasIncomingAttack, setSingleAttackSecondsLeft]);

	// --- Countdown Prueba de Suerte (15s) ---
	const prevHasLuckChallengeRef = useRef(false);
	const luckChallengeTimerRef = useRef<ReturnType<typeof setInterval> | null>(
		null,
	);

	useEffect(() => {
		const isTarget = hasLuckChallenge;
		const wasTarget = prevHasLuckChallengeRef.current;
		prevHasLuckChallengeRef.current = isTarget;

		if (isTarget && !wasTarget) {
			setLuckChallengeSecondsLeft(15);
			if (luckChallengeTimerRef.current)
				clearInterval(luckChallengeTimerRef.current);

			luckChallengeTimerRef.current = setInterval(() => {
				setLuckChallengeSecondsLeft((prev) => {
					if (prev === null || prev <= 1) {
						clearInterval(luckChallengeTimerRef.current!);
						luckChallengeTimerRef.current = null;
						return null;
					}
					return prev - 1;
				});
			}, 1000);
		}

		if (!isTarget && wasTarget) {
			if (luckChallengeTimerRef.current) {
				clearInterval(luckChallengeTimerRef.current);
				luckChallengeTimerRef.current = null;
			}
			setLuckChallengeSecondsLeft(null);
		}

		return () => {
			if (luckChallengeTimerRef.current)
				clearInterval(luckChallengeTimerRef.current);
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
