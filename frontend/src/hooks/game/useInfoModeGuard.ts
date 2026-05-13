// src/hooks/game/useInfoModeGuard.ts

import { useEffect } from "react";
import { useGameUIStore } from "../../store/useGameUIStore";

export function useInfoModeGuard() {
	const isInfoMode = useGameUIStore((state) => state.isInfoMode);
	const setIsInfoMode = useGameUIStore((state) => state.setIsInfoMode);

	useEffect(() => {
		const handleResize = () => {
			if (window.innerWidth >= 1024 && isInfoMode) {
				setIsInfoMode(false);
			}
		};

		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, [isInfoMode, setIsInfoMode]);
}
