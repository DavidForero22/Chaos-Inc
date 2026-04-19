// src/components/game/player/PlayerArea.tsx

import { useEffect } from "react";
import { useGameStore } from "../../../store/useGameStore.ts";
import { useGameUIStore } from "../../../store/useGameUIStore.ts";
import { PlayerHand } from "./PlayerHand.tsx";
import { PlayerStats } from "./PlayerStats.tsx";
import { PlayerBanners } from "./PlayerBanners.tsx";
import { PlayerActions } from "./PlayerActions.tsx";
import styles from "./PlayerArea.module.css";

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
		<div className={styles.folderWrapper}>
			{/* --- ESTRUCTURA FÍSICA DE LA CARPETA --- */}
			<div className={styles.folderBackground}>
				<div className={styles.tabRight}></div>
				<div className={styles.texture} />
			</div>

			{/* --- CONTENIDO DE LA CARPETA --- */}
			<div className={styles.contentArea}>
				{/* Banner superior */}
				<div className="absolute -top-6 left-8 z-50">
					<PlayerBanners me={me} />
				</div>

				{/* 1. Tus Stats (Currículum sobresaliendo) */}
				<div className="shrink-0 z-40 w-65 h-[99%] -mt-6 transform rotate-2 relative">
					<div className="absolute inset-0 bg-black opacity-10 blur-md rounded -z-10 transform translate-x-2 translate-y-2"></div>
					<PlayerStats
						me={me}
						turnTimeLeft={turnTimeLeft}
						isTurnPaused={isTurnPaused}
					/>
				</div>

				{/* 2 y 3. Acciones y Mano (Centro y Derecha Unificados) */}
				{/* Ahora están en una sola columna, las acciones ocupan todo el ancho superior */}
				<div className="flex-1 min-w-0 h-full relative z-20 flex flex-col justify-end pb-2 pt-10">
					<PlayerActions />
					<PlayerHand />
				</div>
			</div>
		</div>
	);
}
