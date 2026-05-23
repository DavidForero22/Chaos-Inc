// src/hooks/useModalOverlay.ts

import { useState, useEffect } from "react";

export function useModalOverlay(
	onClose: () => void,
	disableBackdropClick = false,
) {
	const [isClosing, setIsClosing] = useState(false);

	const closeAnimated = () => {
		if (isClosing) return;
		setIsClosing(true);
		setTimeout(() => onClose(), 300); // Coincide con la duración de la animación en CSS
	};

	const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
		if (e.target === e.currentTarget && !disableBackdropClick) {
			closeAnimated();
		}
	};

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape" && !disableBackdropClick) {
				closeAnimated();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		document.body.style.overflow = "hidden"; // Prevenir scroll de fondo

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
			document.body.style.overflow = "unset";
		};
	}, [disableBackdropClick, isClosing, onClose]);

	return { isClosing, closeAnimated, handleBackdropClick };
}
