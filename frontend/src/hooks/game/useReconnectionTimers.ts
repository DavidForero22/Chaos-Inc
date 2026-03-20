// src/hooks/game/useReconnectionTimers.ts

import { useState, useEffect, useRef } from "react";
import { logWithTime } from "../../utils/logger.ts";

export function useReconnectionTimers(
	bossDisconnected: boolean | undefined,
	actingBossDisconnected: boolean | undefined,
	endingSoon: boolean | undefined,
	hasActingBoss: boolean | undefined,
) {
	const [showInheritanceBanner, setShowInheritanceBanner] = useState(false);
	const prevHasActingBossRef = useRef(hasActingBoss);
	const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// --- Efecto del Banner Informativo de Herencia ---
	useEffect(() => {
		const isActingBossNow = Boolean(hasActingBoss);
		const wasActingBossBefore = Boolean(prevHasActingBossRef.current);
		prevHasActingBossRef.current = isActingBossNow;

		// La regla de oro: Solo mostramos el banner si antes NO había jefe interino
		// y ahora SÍ hay uno (porque el tiempo expiró o alguien murió y se heredó)
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
	}, [bossDisconnected, endingSoon]);

	return {
		showBossWaiting: Boolean(bossDisconnected),
		showActingBossWaiting: Boolean(actingBossDisconnected),
		showEndingWaiting: Boolean(endingSoon),
		showInheritanceBanner,
	};
}
