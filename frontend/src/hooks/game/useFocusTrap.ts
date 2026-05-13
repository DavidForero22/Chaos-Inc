// src/hooks/game/useFocusTrap.ts — reemplazar entero

import { useEffect } from "react";

const FOCUSABLE_SELECTORS = [
	"button:not([disabled])",
	"[href]",
	"input:not([disabled])",
	"select:not([disabled])",
	"textarea:not([disabled])",
	'[tabindex]:not([tabindex="-1"])',
].join(", ");

export function useFocusTrap(
	refs: React.RefObject<HTMLElement | null>[],
	active: boolean,
) {
	useEffect(() => {
		if (!active) return;

		// Usar la primera ref que esté montada y visible
		const container = refs
			.map((r) => r.current)
			.find((el) => el && el.offsetParent !== null);

		if (!container) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key !== "Tab") return;

			const focusable = Array.from(
				container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS),
			);
			if (focusable.length === 0) return;

			const first = focusable[0];
			const last = focusable[focusable.length - 1];

			if (e.shiftKey) {
				if (document.activeElement === first) {
					e.preventDefault();
					last.focus();
				}
			} else {
				if (document.activeElement === last) {
					e.preventDefault();
					first.focus();
				}
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [active, refs]);
}
