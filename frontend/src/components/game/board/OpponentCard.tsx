// src/components/game/board/OpponentCard.tsx
// Accesibilidad comprobada: SI

import type { Opponent, CardInstance } from "../../../types/live-game.ts";
import {
	useOpponentPerks,
	type OpponentPerkSlot,
} from "../../../hooks/game/useOpponentPerks.ts";
import { useState } from "react";
import { CardInfoModal } from "../overlays/CardInfoModal.tsx";
import { useGameStore } from "../../../store/useGameStore.ts";
import styles from "./OpponentCard.module.css";


interface OpponentCardProps {
	player: Opponent;
	isMyTurn: boolean;
	selectedCard: CardInstance | null;
	onAction: (targetName: string, isOnline: boolean, perkKey?: string) => void;
	turnTimeLeft?: number | null;
	isTurnPaused?: boolean;
}

type NonOpponentTarget = Exclude<CardInstance["target"], "opponent">;

const isOpponentTargetCard = (
	card: CardInstance | null,
): card is CardInstance & { target: "opponent" } =>
	!!card && card.target === "opponent";

const isNonOpponentTargetCard = (
	card: CardInstance | null,
): card is CardInstance & { target: NonOpponentTarget } =>
	!!card && card.target !== "opponent";

export function OpponentCard({
	player,
	isMyTurn,
	selectedCard,
	onAction,
	turnTimeLeft,
	isTurnPaused,
}: OpponentCardProps) {
	const opponentPerks = useOpponentPerks(player);
	const [infoCard, setInfoCard] = useState<CardInstance | null>(null);
	const [avatarError, setAvatarError] = useState(false);

	const currentTurn = useGameStore(
		(state) => state.gameData?.game?.current_turn,
	);
	const isThisOpponentTurn = currentTurn === player.id && !player.is_dead;

	// --- REGLAS DE SELECCIÓN ---
	const isCardActive = isMyTurn && selectedCard !== null;
	const isTargetingCard = isOpponentTargetCard(selectedCard);
	const isNonOpponentTarget = isNonOpponentTargetCard(selectedCard);

	const isOutOfRange = selectedCard?.card_id === 1 && !player.is_in_range;
	const isUnstealable = selectedCard?.card_id === 4 && player.cards_count === 0;
	const isCurrentlyBlocked =
		player.conditions?.is_blocked ?? (player as any).is_blocked ?? false;
	const isSabotageUntargetable =
		selectedCard?.card_id === 9 && player.cards_count === 0;

	const isPlayerBlocked = selectedCard?.card_id === 6 && isCurrentlyBlocked;

	let tooltipMessage = "";
	let isUnclickable = false;

	if (player.is_dead) {
		tooltipMessage = "Este jugador ya está muerto.";
		isUnclickable = true;
	} else if (!player.is_online) {
		tooltipMessage = "Este jugador está desconectado.";
		isUnclickable = true;
	} else if (isCardActive && isNonOpponentTarget) {
		tooltipMessage =
			selectedCard?.target === "self"
				? "Esta carta es de auto-uso."
				: "Esta carta no se usa sobre oponentes.";
		isUnclickable = true;
	} else if (isCardActive && isTargetingCard) {
		if (isOutOfRange) {
			tooltipMessage =
				"Este jugador está demasiado lejos para tu rango actual.";
			isUnclickable = true;
		} else if (isUnstealable) {
			tooltipMessage = "Este jugador no tiene cartas que robar.";
			isUnclickable = true;
		} else if (isPlayerBlocked) {
			tooltipMessage = "Este jugador ya tiene un bloqueo activo.";
			isUnclickable = true;
		} else if (isSabotageUntargetable) {
			tooltipMessage = "Este jugador no tiene cartas que descartar.";
			isUnclickable = true;
		}
	}

	const canBeTargeted = isCardActive && isTargetingCard && !isUnclickable;
	const isCleanMode = selectedCard?.card_id === 12 && isMyTurn;
	const canCleanGlobally = isCleanMode && !player.is_dead && player.is_online;

	const avatarUrl = player.avatar?.startsWith("http")
		? player.avatar
		: player.avatar
			? `http://localhost:8000/storage/${player.avatar}`
			: undefined;

	const showAvatar = !!avatarUrl && !avatarError;
	const initials = player.name.substring(0, 2).toUpperCase();

	// Estado general para lectores de pantalla
	const srStatus = player.is_dead
		? "Derrotado"
		: !player.is_online
			? "Desconectado"
			: isCurrentlyBlocked
				? "Bloqueado"
				: "Activo";

	const renderPerkSlot = (slot: OpponentPerkSlot) => {
		if (slot.isEmpty) {
			return (
				<div
					key={slot.id}
					aria-hidden="true" // Es decorativo si está vacío
					className="flex items-center justify-center w-8 h-8 text-[10px] text-gray-500 font-mono bg-[#e5e7e4] rounded-sm border border-dashed border-gray-400"
				>
					{slot.icon}
				</div>
			);
		}

		return (
			<button
				key={slot.id}
				type="button"
				aria-label={
					canCleanGlobally
						? `Descartar perk: ${slot.title}`
						: `Ver información de ${slot.title}`
				}
				onClick={(e) => {
					e.stopPropagation(); // Evita que el clic se propague al botón principal de la tarjeta
					if (canCleanGlobally) {
						onAction(player.id, player.is_online, slot.id);
					} else if (slot.cardType !== undefined) {
						setInfoCard({
							id: slot.id,
							card_id: 0,
							type: slot.cardType as any,
							target: "none",
							base_name: "Pasiva",
							name: slot.name ?? slot.title,
							description: slot.title,
							lore: "",
							icons: [],
						});
					}
				}}
				className={`relative z-20 pointer-events-auto flex items-center justify-center w-8 h-8 text-white text-[16px] font-bold rounded-sm shadow-sm transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-400 ${
					canCleanGlobally
						? "cursor-pointer animate-pulse ring-2 ring-red-500 bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.8)]"
						: "cursor-help bg-[#393e42] border border-[#295c60]"
				}`}
			>
				<span aria-hidden="true">{slot.icon}</span>
			</button>
		);
	};

	return (
		<article
			className={`
                relative flex flex-col items-center
                ${styles.cardBase}
                ${isThisOpponentTurn ? "ring-4 ring-[#cbbe34] shadow-[0_0_20px_rgba(203,190,52,0.6)] -translate-y-2" : ""}
                ${player.is_dead ? "scale-95 border-2 border-red-900 bg-red-50/20 shadow-none opacity-80" : ""}
                ${!player.is_online && !player.is_dead ? "scale-95 border-gray-400 shadow-none opacity-90" : ""}
                ${isUnclickable && !player.is_dead && player.is_online ? "scale-95 opacity-80" : ""}
                ${canBeTargeted ? "hover:scale-110 ring-4 ring-blue-500 shadow-[0_0_25px_rgba(59,130,246,0.8)]" : ""}
            `}
		>
			{/* TEXTO EXCLUSIVO PARA LECTOR DE PANTALLA */}
			<span className="sr-only">
				Jugador {player.name}, Rol: {player.role}. Estado: {srStatus}.{" "}
				{tooltipMessage}
			</span>

			{/* BOTÓN PRINCIPAL */}
			<button
				type="button"
				className={`absolute inset-0 w-full h-full z-0 rounded-md focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500 ${
					canBeTargeted
						? "cursor-crosshair"
						: isUnclickable
							? "cursor-not-allowed"
							: "cursor-default"
				}`}
				disabled={
					isUnclickable || isNonOpponentTarget || selectedCard?.card_id === 12
				}
				onClick={() => onAction(player.id, player.is_online)}
				aria-label={
					canBeTargeted
						? `Atacar a ${player.name}`
						: `Seleccionar a ${player.name}`
				}
			/>

			{/* CONTENIDO VISUAL */}
			<div className="w-full flex flex-col items-center relative z-10 pointer-events-none">
				{/* Sello del Jefe */}
				{player.role === "boss" && (
					<div className={styles.goldSeal}>
						<span role="img" aria-label="Rol de Jefe">
							👑
						</span>
					</div>
				)}

				<div className="w-12 h-2 bg-gray-900/10 rounded-full border border-gray-300/50 mb-3 shadow-inner"></div>

				{/* Indicador de rango */}
				{!player.is_dead && player.is_online && (
					<div className="absolute top-3 left-2 text-[11px] text-[#393e42] font-black bg-gray-200 px-1.5 py-0.5 rounded shadow-sm border border-gray-300">
						<span aria-hidden="true">📍</span> {player.distance}m
					</div>
				)}

				{/* Indicadores visuales flotantes */}
				{(player.is_dead || !player.is_online) && (
					<div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-50">
						{player.is_dead && (
							<div
								aria-hidden="true"
								className="bg-black text-red-600 text-sm font-black px-4 py-2 rounded shadow-xl rotate-12 uppercase border-2 border-red-800 whitespace-nowrap"
							>
								DERROTADO
							</div>
						)}
						{!player.is_online && (
							<div
								aria-hidden="true"
								className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded shadow-xl -rotate-[8deg] uppercase border border-red-800 whitespace-nowrap"
							>
								DESCONECTADO
							</div>
						)}
					</div>
				)}

				{isCurrentlyBlocked && (
					<div className="absolute top-10 right-0 text-[20px] drop-shadow-md z-50">
						<span role="img" aria-label="Jugador bloqueado">
							🔒
						</span>
					</div>
				)}

				{/* Foto */}
				<div
					className={`${styles.photoBox} ${player.is_dead || !player.is_online ? "grayscale contrast-125" : ""}`}
				>
					{showAvatar ? (
						<img
							src={avatarUrl}
							alt="" // Vacio porque el nombre del jugador ya se lee en el h3 debajo
							className={styles.photoImage}
							onError={() => setAvatarError(true)}
							referrerPolicy="no-referrer"
						/>
					) : (
						<span
							aria-hidden="true"
							className="text-3xl font-black text-gray-400 opacity-50"
						>
							{initials}
						</span>
					)}
				</div>

				<h3 className="font-black text-[#393e42] text-sm truncate w-full uppercase mb-4">
					{player.name}
				</h3>

				{/* Rol */}
				{player.role !== "boss" && (
					<span className="text-[10px] font-bold text-[#295c60] bg-[#295c60]/10 px-2 py-0.5 rounded mb-3 uppercase">
						{player.role === "secretary"
							? "Secretario"
							: player.role === "intern"
								? "Becaria"
								: "Sindicato"}
					</span>
				)}
				{player.role === "boss" && (
					<span className="text-[10px] font-bold text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded mb-3 uppercase">
						Jefe
					</span>
				)}

				{/* Métricas */}
				<div className="flex w-full justify-between items-center mb-3 px-1">
					<div className="flex flex-col items-center">
						<span className="text-[9px] uppercase font-bold text-gray-500 mb-0.5">
							Cartas
						</span>
						<span className="text-sm font-black text-[#295c60] bg-[#295c60]/10 px-2 rounded">
							{player.cards_count}
						</span>
					</div>
					<div className="flex flex-col items-center">
						<span className="text-[9px] uppercase font-bold text-gray-500 mb-0.5">
							Estrés
						</span>
						<span
							className={`text-sm font-black px-2 rounded ${player.stress > 0 ? "text-red-600 bg-red-100" : "text-[#393e42] bg-gray-200"}`}
						>
							{player.stress}
						</span>
					</div>
				</div>
			</div>

			{/* BANDEJA DE EQUIPAMIENTO */}
			<div className="w-full bg-[#393e42]/5 border-t border-gray-300 pt-2 flex justify-center gap-2 relative z-20 pointer-events-none">
				{opponentPerks.map(renderPerkSlot)}
			</div>

			{/* Temporizador */}
			{isThisOpponentTurn &&
				turnTimeLeft !== null &&
				turnTimeLeft !== undefined && (
					<div
						aria-live="polite"
						className="absolute -bottom-4 bg-[#1a1a1a] border-2 border-[#cbbe34] text-[#cbbe34] text-xs font-black px-4 py-1 rounded shadow-lg z-30 whitespace-nowrap"
					>
						{isTurnPaused ? (
							<span className="text-white animate-pulse">PAUSA</span>
						) : (
							`0:${turnTimeLeft.toString().padStart(2, "0")}`
						)}
					</div>
				)}

			{infoCard && (
				<CardInfoModal card={infoCard} onClose={() => setInfoCard(null)} />
			)}
		</article>
	);
}
