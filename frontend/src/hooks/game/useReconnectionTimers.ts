import { useState, useEffect, useRef } from "react";
import { logWithTime } from "../../utils/logger.ts";

export function useReconnectionTimers(
	bossDisconnected: boolean | undefined,
	actingBossGraceTrigger: number,
	internGraceCancelled: boolean,
	setInternGraceCancelled: (val: boolean) => void,
	endingSoon: boolean | undefined,
) {
	// Timer del Jefe Principal
	const [graceSecondsLeft, setGraceSecondsLeft] = useState<number | null>(null);
	const [showInheritanceBanner, setShowInheritanceBanner] = useState(false);
	const prevBossDisconnectedRef = useRef(false);
	const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Timer de reconexión para victoria/cancelación
	const [endingSecondsLeft, setEndingSecondsLeft] = useState<number | null>(
		null,
	);
	const prevEndingSoonRef = useRef(false);
	const endingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

	// Timer del Becario (Jefe Heredado)
	const [internGraceSecondsLeft, setInternGraceSecondsLeft] = useState<
		number | null
	>(null);
	const internCountdownRef = useRef<ReturnType<typeof setInterval> | null>(
		null,
	);

	// --- Efecto del Jefe Principal ---
	useEffect(() => {
		const isDisconnected = Boolean(bossDisconnected);
		const wasDisconnected = prevBossDisconnectedRef.current;
		prevBossDisconnectedRef.current = isDisconnected;

		if (isDisconnected && !wasDisconnected) {
			setGraceSecondsLeft(10);
			logWithTime("Iniciando cuenta atras de setGraceSecondsLeft (10s).");
			if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

			countdownTimerRef.current = setInterval(() => {
				setGraceSecondsLeft((prev) => {
					if (prev === null || prev <= 1) {
						clearInterval(countdownTimerRef.current!);
						countdownTimerRef.current = null;
						setShowInheritanceBanner(true);

						if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
						bannerTimerRef.current = setTimeout(
							() => setShowInheritanceBanner(false),
							4500,
						);
						return null;
					}
					return prev - 1;
				});
			}, 1000);
		}

		if (!isDisconnected && wasDisconnected) {
			if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
			if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
			setGraceSecondsLeft(null);
			setShowInheritanceBanner(false);
		}

		return () => {
			if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
			if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
		};
	}, [bossDisconnected]);

	// --- Efecto del Becario (Inicio) ---
	useEffect(() => {
		if (!actingBossGraceTrigger) return;

		logWithTime("Iniciando cuenta atras de internCountdownRef (10s).");
		setInternGraceSecondsLeft(10);

		if (internCountdownRef.current) clearInterval(internCountdownRef.current);
		internCountdownRef.current = setInterval(() => {
			setInternGraceSecondsLeft((prev) => {
				if (prev === null || prev <= 1) {
					clearInterval(internCountdownRef.current!);
					internCountdownRef.current = null;
					return null;
				}
				return prev - 1;
			});
		}, 1000);

		return () => {
			if (internCountdownRef.current) clearInterval(internCountdownRef.current);
		};
	}, [actingBossGraceTrigger]);

	// --- Efecto del Becario (Cancelación) ---
	useEffect(() => {
		if (!internGraceCancelled) return;
		setInternGraceCancelled(false);

		if (internCountdownRef.current) {
			clearInterval(internCountdownRef.current);
			internCountdownRef.current = null;
			setInternGraceSecondsLeft(null);
		}
	}, [internGraceCancelled, setInternGraceCancelled]);

	// Contador de reconexión para ganar o cancelar partida
	useEffect(() => {
		const isEnding = Boolean(endingSoon);
		const wasEnding = prevEndingSoonRef.current;
		prevEndingSoonRef.current = isEnding;

		if (isEnding && !wasEnding) {
			setEndingSecondsLeft(10);
			if (endingTimerRef.current) clearInterval(endingTimerRef.current);
			endingTimerRef.current = setInterval(() => {
				setEndingSecondsLeft((prev) => {
					if (prev === null || prev <= 1) {
						clearInterval(endingTimerRef.current!);
						endingTimerRef.current = null;
						return null;
					}
					return prev - 1;
				});
			}, 1000);
		}

		if (!isEnding && wasEnding) {
			if (endingTimerRef.current) clearInterval(endingTimerRef.current);
			setEndingSecondsLeft(null);
		}

		return () => {
			if (endingTimerRef.current) clearInterval(endingTimerRef.current);
		};
	}, [endingSoon]);

	return {
		graceSecondsLeft,
		showInheritanceBanner,
		internGraceSecondsLeft,
		endingSecondsLeft,
	};
}
