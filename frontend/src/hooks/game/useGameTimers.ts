// src/hooks/game/useGameTimers.ts

import { useState, useEffect, useRef } from "react";
import { logWithTime } from "../../utils/logger.ts";
import { useGameStore } from "../../store/useGameStore.ts";
import { useTimerStore } from "../../store/useTimerStore.ts";

export function useGameTimers() {
	const gameData = useGameStore((state) => state.gameData);
	const reactToMultiAttack = useGameStore((state) => state.reactToMultiAttack);

	// 1. Traemos SOLO los setters de Zustand
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

	// 2. Exportamos SOLO lo que no cambia cada segundo
	return {
		showBossWaiting: Boolean(bossDisconnected),
		showActingBossWaiting: Boolean(actingBossDisconnected),
		showEndingWaiting: Boolean(endingSoon),
		showInheritanceBanner,
	};
}
