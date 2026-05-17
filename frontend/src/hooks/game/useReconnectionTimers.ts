// src/hooks/game/useReconnectionTimers.ts

import { useState, useEffect, useRef } from "react";
import { logWithTime } from "../../utils/logger.ts";
import { useGameStore } from "../../store/game/useGameStore.ts"; // <-- Importamos el store

export function useReconnectionTimers() {
	// Extraemos solo lo que necesitamos del store
	const gameData = useGameStore((state) => state.gameData);

	const bossDisconnected = gameData?.game?.boss_disconnected;
	const actingBossDisconnected = gameData?.game?.acting_boss_disconnected;
	const endingSoon = gameData?.game?.ending_soon;
	const hasActingBoss = gameData?.game?.has_acting_boss;

	const [showInheritanceBanner, setShowInheritanceBanner] = useState(false);
	const prevHasActingBossRef = useRef(hasActingBoss);
	const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// --- Efecto del Banner Informativo de Herencia ---
	useEffect(() => {
		const isActingBossNow = Boolean(hasActingBoss);
		const wasActingBossBefore = Boolean(prevHasActingBossRef.current);
		prevHasActingBossRef.current = isActingBossNow;

		if (isActingBossNow && !wasActingBossBefore && !endingSoon) {
			logWithTime(
				"useReconnectionTimers.ts - Mostrando banner de herencia real.",
			);
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

	return {
		showBossWaiting: Boolean(bossDisconnected),
		showActingBossWaiting: Boolean(actingBossDisconnected),
		showEndingWaiting: Boolean(endingSoon),
		showInheritanceBanner,
	};
}
