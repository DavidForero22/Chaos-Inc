// src/hooks/game/useGameTimers.ts

import { useState, useEffect, useRef } from "react";
import { logWithTime } from "../../utils/logger.ts";
import { useGameStore } from "../../store/useGameStore.ts";

export function useGameTimers() {
	const gameData = useGameStore((state) => state.gameData);
	const reactToMultiAttack = useGameStore((state) => state.reactToMultiAttack);

	const bossDisconnected = gameData?.game?.boss_disconnected;
	const actingBossDisconnected = gameData?.game?.acting_boss_disconnected;
	const endingSoon = gameData?.game?.ending_soon;
	const hasActingBoss = gameData?.game?.has_acting_boss;
	const hasPendingMultiAttack = gameData?.me?.combat_state.is_defending_multi ?? false;

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
	const [multiAttackSecondsLeft, setMultiAttackSecondsLeft] = useState<
		number | null
	>(null);
	const prevHasPendingMultiRef = useRef(false);
	const multiAttackTimerRef = useRef<ReturnType<typeof setInterval> | null>(
		null,
	);

	useEffect(() => {
		const isTarget = hasPendingMultiAttack;
		const wasTarget = prevHasPendingMultiRef.current;
		prevHasPendingMultiRef.current = isTarget;

		if (isTarget && !wasTarget) {
			// Empieza el countdown
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
			// Ya respondió o el ataque terminó — limpiar timer
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
	}, [hasPendingMultiAttack, reactToMultiAttack]);

	return {
		showBossWaiting: Boolean(bossDisconnected),
		showActingBossWaiting: Boolean(actingBossDisconnected),
		showEndingWaiting: Boolean(endingSoon),
		showInheritanceBanner,
		multiAttackSecondsLeft,
	};
}
