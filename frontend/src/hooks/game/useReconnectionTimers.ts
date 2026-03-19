// src/hooks/game/useReconnectionTimers.ts

import { useState, useEffect, useRef } from "react";
import { logWithTime } from "../../utils/logger.ts";

export function useReconnectionTimers(
	bossDisconnected: boolean | undefined,
	actingBossDisconnected: boolean | undefined,
	endingSoon: boolean | undefined,
) {
	const [showInheritanceBanner, setShowInheritanceBanner] = useState(false);
	const prevBossDisconnectedRef = useRef(false);
	const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// --- Efecto del Banner Informativo de Herencia ---
	useEffect(() => {
		const isDisconnected = Boolean(bossDisconnected);
		const wasDisconnected = prevBossDisconnectedRef.current;
		prevBossDisconnectedRef.current = isDisconnected;

		// Si el jefe estaba desconectado y AHORA ya no lo está...
		// PERO seguimos en la partida (no ending), significa que alguien heredó.
		if (!isDisconnected && wasDisconnected && !endingSoon) {
			logWithTime("useReconnectionTimers.ts - Mostrando banner de herencia.");
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
