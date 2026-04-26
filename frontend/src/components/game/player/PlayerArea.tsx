// src/components/game/player/PlayerArea.tsx

import { useEffect, useState, useRef } from "react";
import { useGameStore } from "../../../store/useGameStore.ts";
import { useGameUIStore } from "../../../store/useGameUIStore.ts";
import { TARGET_CARDS } from "../../../hooks/game/usePlayerActions.ts";

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
		selectedCardId,
	} = useGameUIStore();

	const [activeTab, setActiveTab] = useState<"hand" | "stats">("hand");

	// Referencia para detectar si estábamos en modo apuntado
	const prevIsTargeting = useRef<boolean>(false);

	const currentTurn = useGameStore(
		(state) => state.gameData?.game?.current_turn,
	);
	const myName = me?.name;

	useEffect(() => {
		if (!me) return;
		if (me.conditions.must_discard && !isDiscardMode) {
			setIsDiscardMode(true);
			setActiveTab("hand");
			setFolderExpanded(true);
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

	// Evaluamos si la carta actual requiere apuntar
	const selectedCard = me?.cards.find((c) => c.id === selectedCardId);
	const isTargetingMode = selectedCard
		? TARGET_CARDS.includes(selectedCard.type)
		: false;

	// Auto-Minimizar/Maximizar solo al apuntar
	useEffect(() => {
		if (isTargetingMode && !prevIsTargeting.current) {
			// Entrar en modo apuntado -> cerrar la carpeta
			setFolderExpanded(false);
		} else if (!isTargetingMode && prevIsTargeting.current) {
			// Salir del modo apuntado -> abrir la carpeta
			setFolderExpanded(true);
		}

		prevIsTargeting.current = isTargetingMode;
	}, [isTargetingMode, setFolderExpanded]);

	if (!me) return null;

	// --- LÓGICA DE PESTAÑAS ---
	const handleTabClick = (tab: "hand" | "stats") => {
		// Bloquear el clic si esta apuntando a un enemigo
		if (isTargetingMode) return;

		if (!isFolderExpanded) {
			// Si está cerrada, abrir y seleccionar la pestaña
			setActiveTab(tab);
			setFolderExpanded(true);
		} else if (activeTab === tab) {
			// Si está abierta y toca la misma pestaña, cerrarla
			setFolderExpanded(false);
		} else {
			// Si está abierta y toca otra pestaña, solo cambiar la vista
			setActiveTab(tab);
		}
	};

	// Auto-abrir carpeta cuando empieza mi turno
	useEffect(() => {
		const isMyTurnNow = currentTurn === myName;

		// Si empieza el turno y la carpeta está cerrada, abrirla
		if (isMyTurnNow && !isFolderExpanded && !isTargetingMode) {
			setFolderExpanded(true);
		}
	}, [
		currentTurn,
		myName,
		isFolderExpanded,
		isTargetingMode,
		setFolderExpanded,
	]);

	return (
		<div
			className={`${styles.folderWrapper} ${isFolderExpanded ? styles.folderExpanded : styles.folderClosed}`}
		>
			{/* --- ESTRUCTURA FÍSICA DE LA CARPETA --- */}
			<div className={styles.folderBackground}>
				{/* Pestañas para MÓVIL - Se DESHABILITAN visualmente en modo apuntado */}
				<div
					className={`absolute -top-8 left-4 z-0 flex gap-2 lg:hidden transition-opacity ${isTargetingMode ? "opacity-30 cursor-not-allowed" : "opacity-100"}`}
				>
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

				<div className={`${styles.tabRight} hidden lg:block`}></div>
				<div className={styles.texture} />
			</div>

			{/* --- CONTENIDO DE LA CARPETA --- */}
			<div className={styles.contentArea}>
				<div className="absolute -top-6 right-4 lg:left-8 lg:right-auto z-50">
					<PlayerBanners me={me} />
				</div>

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
