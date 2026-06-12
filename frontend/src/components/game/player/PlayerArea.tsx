// src/components/game/player/PlayerArea.tsx
// Accesibilidad comprobada: SI

import { useEffect, useState, useRef } from "react";
import { useGameStore } from "../../../store/game/useGameStore.ts";
import { useGameUIStore } from "../../../store/game/useGameUIStore.ts";

import { PlayerHand } from "./PlayerHand.tsx";
import { PlayerStats } from "./PlayerStats.tsx";
import { PlayerBanners } from "./PlayerBanners.tsx";
import { PlayerActions } from "./PlayerActions.tsx";
import { PlayerTimer } from "./PlayerTimer.tsx";
import { usePlayerStats } from "../../../hooks/game/players/usePlayerStats.ts";
import { PerkSlot } from "./PerkSlot.tsx";

import styles from "./PlayerArea.module.css";

interface PlayerAreaProps {
	turnTimeLeft: number | null;
	isTurnPaused?: boolean;
}

export function PlayerArea({ turnTimeLeft, isTurnPaused }: PlayerAreaProps) {
	const me = useGameStore((state) => state.gameData?.me);
	const currentTurn = useGameStore(
		(state) => state.gameData?.game?.current_turn,
	);

	const {
		isDiscardMode,
		setIsDiscardMode,
		isFolderExpanded,
		setFolderExpanded,
		selectedCardId,
		isSacrificeMode,
		sacrificeCardId,
	} = useGameUIStore();

	const [activeTab, setActiveTab] = useState<"hand" | "stats">("hand");

	// ── ESTADO REACTIVO PARA PANTALLAS COMPACTAS (OR de Ancho y Alto) ──
	const [isCompactScreen, setIsCompactScreen] = useState(
		typeof window !== "undefined"
			? window.innerWidth < 1024 || window.innerHeight <= 700
			: false
	);

	// Escuchador de redimensionamiento
	useEffect(() => {
		const handleResize = () => {
			setIsCompactScreen(window.innerWidth < 1024 || window.innerHeight <= 700);
		};
		window.addEventListener("resize", handleResize);
		// Llamada inicial por seguridad
		handleResize();
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	// Referencias para transiciones de estado
	const prevIsTargeting = useRef<boolean>(false);
	const prevIsDefending = useRef<boolean>(false);
	const prevIsMyTurn = useRef<boolean>(false);

	// Lógica de Descartes y Sabotajes
	useEffect(() => {
		if (!me) return;

		if (me.conditions.must_discard && !isDiscardMode) {
			setIsDiscardMode(true);
			setActiveTab("hand");
			setFolderExpanded(true);
		}
	}, [
		me?.conditions.must_discard,
		isDiscardMode,
		setIsDiscardMode,
		setFolderExpanded,
	]);

	// Evaluación de estados actuales
	const selectedCard = me?.cards.find((c) => c.id === selectedCardId);
	const isTargetingMode = selectedCard?.target === "opponent";
	const isMyTurnNow = currentTurn === me?.id;
	const isDefending =
		me?.combat_state.is_defending_single || me?.combat_state.is_defending_multi;

	// Reacciones Automáticas de la Interfaz
	useEffect(() => {
		const sacrificePending = isSacrificeMode && sacrificeCardId === null;
		if (isTargetingMode && !prevIsTargeting.current && !sacrificePending) {
			setFolderExpanded(false);
		} else if (!isTargetingMode && prevIsTargeting.current) {
			setFolderExpanded(true);
		}

		if (isMyTurnNow && !prevIsMyTurn.current && !isTargetingMode) {
			setFolderExpanded(true);
		}

		if (isDefending && !prevIsDefending.current && !isTargetingMode) {
			setActiveTab("hand");
			setFolderExpanded(true);
		}

		prevIsTargeting.current = isTargetingMode;
		prevIsDefending.current = !!isDefending;
		prevIsMyTurn.current = isMyTurnNow;
	}, [
		isTargetingMode,
		isMyTurnNow,
		isDefending,
		setFolderExpanded,
		isSacrificeMode,
		sacrificeCardId,
	]);

	useEffect(() => {
		if (isTargetingMode && isSacrificeMode && sacrificeCardId !== null) {
			setFolderExpanded(false);
		}
	}, [sacrificeCardId]);

	if (!me) return null;

	const handleTabClick = (tab: "hand" | "stats") => {
		if (isTargetingMode) return;

		if (!isFolderExpanded) {
			setActiveTab(tab);
			setFolderExpanded(true);
		} else if (activeTab === tab) {
			setFolderExpanded(false);
		} else {
			setActiveTab(tab);
		}
	};

	const { displayPerks } = usePlayerStats(me);
	const activePerks = displayPerks.filter((p) => !p.isEmpty);
	const showPerksDiscardSheet =
		isDiscardMode && !me.conditions.must_discard && activePerks.length > 0;

	return (
		<section
			aria-label="Área del Jugador"
			className={`${styles.folderWrapper} ${isFolderExpanded ? styles.folderExpanded : styles.folderClosed}`}
		>
			{/* HOJA FLOTANTE PARA DESCARTAR PASIVAS */}
			<div
				aria-hidden={!showPerksDiscardSheet}
				className={`absolute right-4 z-0 transition-all duration-500 origin-bottom flex flex-col items-center
                ${!isCompactScreen && "hidden"} 
                ${showPerksDiscardSheet ? "-top-17.5" : "top-2 pointer-events-none opacity-0"}`}
			>
				<div className="bg-[#f8f9f8] border border-[#c7c9c7] px-4 py-3 rounded-sm shadow-md flex flex-col items-center gap-2 transform rotate-3">
					<span className="text-[10px] uppercase font-bold text-red-600 border-b border-red-600/30 w-full text-center pb-1">
						Pasivas activas
					</span>
					<ul className="flex gap-2 m-0 p-0 list-none">
						{activePerks.map((perk) => (
							<li key={`discard-${perk.id}`}>
								<PerkSlot
									id={perk.id}
									icon={perk.icon}
									title={perk.title}
									isUnderSabotage={false}
								/>
							</li>
						))}
					</ul>
				</div>
			</div>

			{/* --- ESTRUCTURA FÍSICA DE LA CARPETA --- */}
			<div className={styles.folderBackground}>
				{/* Pestañas para MÓVIL y PC de baja altura */}
				<div
					role="tablist"
					aria-label="Vistas del jugador"
					className={`absolute -top-8 left-4 z-0 flex gap-2 transition-opacity ${!isCompactScreen && "hidden"} ${isTargetingMode ? "opacity-30 cursor-not-allowed" : "opacity-100"}`}
				>
					<button
						role="tab"
						id="tab-stats"
						aria-controls="panel-stats"
						aria-selected={activeTab === "stats"}
						disabled={isTargetingMode}
						onClick={() => handleTabClick("stats")}
						className={`${styles.mobileTab} ${activeTab === "stats" ? styles.activeTab : ""} focus:outline-none focus-visible:ring-2 focus-visible:ring-[#393e42]`}
					>
						Estado
					</button>
					<button
						role="tab"
						id="tab-hand"
						aria-controls="panel-hand"
						aria-selected={activeTab === "hand"}
						disabled={isTargetingMode}
						onClick={() => handleTabClick("hand")}
						className={`${styles.mobileTab} ${activeTab === "hand" ? styles.activeTab : ""} focus:outline-none focus-visible:ring-2 focus-visible:ring-[#393e42]`}
					>
						Mano ({me.cards.length})
					</button>
				</div>

				<PlayerTimer
					turnTimeLeft={turnTimeLeft}
					isTurnPaused={isTurnPaused}
					className={`absolute -top-7 left-62 z-50 ${!isCompactScreen && "hidden"}`}
				/>

				<div
					className={`${styles.tabRight} ${isCompactScreen ? "hidden" : "block"}`}
					aria-hidden="true"
				></div>
				<div className={styles.texture} aria-hidden="true" />
			</div>

			{/* --- CONTENIDO DE LA CARPETA --- */}
			<div className={styles.contentArea}>
				<div className={`absolute -top-6 z-49 ${isCompactScreen ? "right-4" : "left-8"}`}>
					<PlayerBanners me={me} />
				</div>

				{/* Panel 1: Estado */}
				<div
					id="panel-stats"
					role="tabpanel"
					aria-labelledby="tab-stats"
					hidden={isCompactScreen && activeTab !== "stats"}
					className={`shrink-0 z-40 w-full h-[99%] relative transform ${isCompactScreen
							? (activeTab === "stats" ? "block" : "hidden")
							: "block w-65 -mt-6 rotate-2"
						}`}
				>
					<div
						aria-hidden="true"
						className={`absolute inset-0 bg-black opacity-10 blur-md rounded -z-10 transform translate-x-2 translate-y-2 ${isCompactScreen ? "hidden" : "block"}`}
					></div>
					<PlayerStats
						me={me}
						turnTimeLeft={turnTimeLeft}
						isTurnPaused={isTurnPaused}
						isVisible={activeTab === "stats"}
					/>
				</div>

				{/* Panel 2: Acciones y Mano */}
				<div
					id="panel-hand"
					role="tabpanel"
					aria-labelledby="tab-hand"
					hidden={isCompactScreen && activeTab !== "hand"}
					className={`flex-1 min-w-0 h-full relative z-20 flex-col justify-start pb-2 ${isCompactScreen
							? (activeTab === "hand" ? "flex pt-2" : "hidden")
							: "flex pt-6"
						}`}
				>
					<PlayerActions />
					<PlayerHand />
				</div>
			</div>
		</section>
	);
}