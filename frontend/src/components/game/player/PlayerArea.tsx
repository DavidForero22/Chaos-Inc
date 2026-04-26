// src/components/game/player/PlayerArea.tsx

import { useEffect, useState } from "react";
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
	const {
		isDiscardMode,
		setIsDiscardMode,
		clearDiscardSelection,
		isFolderExpanded,
		setFolderExpanded,
	} = useGameUIStore();

	const [activeTab, setActiveTab] = useState<"hand" | "stats">("hand");

	useEffect(() => {
		if (!me) return;
		if (me.conditions.must_discard && !isDiscardMode) {
			setIsDiscardMode(true);
			setActiveTab("hand");
			setFolderExpanded(true); // Forzamos abrir la carpeta si hay que descartar
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
		setFolderExpanded,
	]);

	if (!me) return null;

	// --- NUEVA LÓGICA DE PESTAÑAS ---
	const handleTabClick = (tab: "hand" | "stats") => {
		if (!isFolderExpanded) {
			// Si está cerrada, abrimos y seleccionamos la pestaña
			setActiveTab(tab);
			setFolderExpanded(true);
		} else if (activeTab === tab) {
			// Si está abierta y tocamos la misma pestaña, la cerramos
			setFolderExpanded(false);
		} else {
			// Si está abierta y tocamos otra pestaña, solo cambiamos la vista
			setActiveTab(tab);
		}
	};

	return (
		<div
			className={`${styles.folderWrapper} ${isFolderExpanded ? styles.folderExpanded : styles.folderClosed}`}
		>
			{/* --- ESTRUCTURA FÍSICA DE LA CARPETA --- */}
			<div className={styles.folderBackground}>
				{/* Pestañas para MÓVIL (Con la nueva lógica) */}
				<div className="absolute -top-8 left-4 z-0 flex gap-2 lg:hidden">
					<button
						onClick={() => handleTabClick("stats")}
						className={`${styles.mobileTab} ${activeTab === "stats" ? styles.activeTab : ""}`}
					>
						Expediente
					</button>
					<button
						onClick={() => handleTabClick("hand")}
						className={`${styles.mobileTab} ${activeTab === "hand" ? styles.activeTab : ""}`}
					>
						Mano ({me.cards.length})
					</button>
				</div>

				{/* Pestaña decorativa PC */}
				<div className={`${styles.tabRight} hidden lg:block`}></div>
				<div className={styles.texture} />
			</div>

			{/* --- CONTENIDO DE LA CARPETA --- */}
			<div className={styles.contentArea}>
				<div className="absolute -top-6 right-4 lg:left-8 lg:right-auto z-50">
					<PlayerBanners me={me} />
				</div>

				{/* Contenido Expediente */}
				<div
					className={`shrink-0 z-40 w-full lg:w-65 h-[99%] lg:-mt-6 transform lg:rotate-2 relative ${activeTab === "stats" ? "block" : "hidden lg:block"}`}
				>
					<div className="hidden lg:block absolute inset-0 bg-black opacity-10 blur-md rounded -z-10 transform translate-x-2 translate-y-2"></div>
					<PlayerStats
						me={me}
						turnTimeLeft={turnTimeLeft}
						isTurnPaused={isTurnPaused}
					/>
				</div>

				{/* Contenido Mano */}
				<div
					className={`flex-1 min-w-0 h-full relative z-20 flex-col justify-start pb-2 pt-2 lg:pt-6 ${activeTab === "hand" ? "flex" : "hidden lg:flex"}`}
				>
					<PlayerActions />
					<PlayerHand />
				</div>
			</div>
		</div>
	);
}
