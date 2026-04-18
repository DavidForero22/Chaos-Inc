// src/components/game/player/PlayerArea.tsx

import { useEffect } from "react";
import { useGameStore } from "../../../store/useGameStore.ts";
import { useGameUIStore } from "../../../store/useGameUIStore.ts";
import { PlayerHand } from "./PlayerHand.tsx";
import { PlayerStats } from "./PlayerStats.tsx";
import { PlayerBanners } from "./PlayerBanners.tsx";
import { PlayerActions } from "./PlayerActions.tsx";

interface PlayerAreaProps {
	turnTimeLeft: number | null;
	isTurnPaused?: boolean;
}

export function PlayerArea({ turnTimeLeft, isTurnPaused }: PlayerAreaProps) {
	const me = useGameStore((state) => state.gameData?.me);
	const { isDiscardMode, setIsDiscardMode, clearDiscardSelection } =
		useGameUIStore();

	useEffect(() => {
		if (!me) return;
		if (me.conditions.must_discard && !isDiscardMode) {
			setIsDiscardMode(true);
		}
		if (
			!me.conditions.must_discard &&
			isDiscardMode &&
			me.cards.length <= me.max_hand_size
		) {
			clearDiscardSelection();
		}
	}, [
		me?.conditions.must_discard,
		isDiscardMode,
		me?.cards.length,
		me?.max_hand_size,
		clearDiscardSelection,
		setIsDiscardMode,
	]);

	if (!me) return null;

	return (
		// Anclado abajo, centrado. Silueta de carpeta abierta.
		<div className="absolute bottom-2.5 left-1/2 transform -translate-x-1/2 w-[90vw] max-w-5xl h-[35vh] min-h-70 z-40 flex items-end">
			{/* Silueta de la Carpeta Manila */}
			<div className="w-full h-full bg-[#c19a6b] rounded-t-xl border-x-4 border-t-4 border-[#8c6b45] shadow-[0_-15px_30px_rgba(0,0,0,0.5)] relative flex items-center px-6 gap-6">
				{/* Textura de la carpeta */}
				<div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cardboard.png')] pointer-events-none rounded-t-xl" />

				{/* Banner superior (Pegatina o Clip) */}
				<div className="absolute -top-6 left-8 z-50">
					<PlayerBanners me={me} />
				</div>

				{/* 1. Tus Stats (Currículum sobresaliendo) */}
                <div className="shrink-0 z-10 w-65 h-[99%] -mt-6 transform rotate-2">
                    <PlayerStats
                        me={me}
                        turnTimeLeft={turnTimeLeft}
                        isTurnPaused={isTurnPaused}
                    />
                </div>

				{/* 2. Tu Mano (Centro de la carpeta) */}
				<div className="flex-1 h-[90%] relative z-10 flex flex-col justify-end pb-4">
					<PlayerHand />
				</div>

				{/* 3. Acciones (Sellos a la derecha) */}
				<div className="shrink-0 z-10 w-37.5 h-[90%] flex flex-col justify-center items-center gap-4">
					<PlayerActions />
				</div>
			</div>
		</div>
	);
}
