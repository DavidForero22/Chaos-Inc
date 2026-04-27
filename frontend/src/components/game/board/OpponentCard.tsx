// frontend/src/components/game/board/OpponentCard.tsx
import type { Opponent } from "../../../types/live-game.ts";
import {
	useOpponentPerks,
	type OpponentPerkSlot,
} from "../../../hooks/game/useOpponentPerks.ts";
import { useState } from "react";
import { CardInfoModal } from "../overlays/CardInfoModal.tsx";
import type { CardInstance } from "../../../types/live-game.ts";
import { useGameStore } from "../../../store/useGameStore.ts";
import styles from "./OpponentCard.module.css";

interface OpponentCardProps {
	player: Opponent;
	isMyTurn: boolean;
	selectedCardId: string | null;
	selectedCardType: number | null;
	onAction: (targetName: string, isOnline: boolean, perkKey?: string) => void;
	turnTimeLeft?: number | null;
	isTurnPaused?: boolean;
}

export function OpponentCard({
	player,
	isMyTurn,
	selectedCardId,
	selectedCardType,
	onAction,
	turnTimeLeft,
	isTurnPaused,
}: OpponentCardProps) {
	const opponentPerks = useOpponentPerks(player);
	const [infoCard, setInfoCard] = useState<CardInstance | null>(null);

	const currentTurn = useGameStore(
		(state) => state.gameData?.game?.current_turn,
	);
	const isThisOpponentTurn = currentTurn === player.name && !player.is_dead;

	// --- REGLAS DE SELECCIÓN ---
	const isCardActive = isMyTurn && selectedCardId !== null;
	const isTargetingCard = [1, 4, 6, 9].includes(selectedCardType || 0);
	const isOutOfRange = selectedCardType === 1 && !player.is_in_range;
	const isUnstealable = selectedCardType === 4 && player.cards_count === 0;

	const isPlayerBlocked =
		player.conditions?.is_blocked ?? (player as any).is_blocked;
	const isAlreadyBlocked = selectedCardType === 6 && isPlayerBlocked;
	const isSabotageUntargetable =
		selectedCardType === 9 && player.cards_count === 0;

	let tooltipMessage = "";
	let isUnclickable = false;

	if (player.is_dead) {
		tooltipMessage = "Este empleado ha sido cesado (Muerto).";
		isUnclickable = true;
	} else if (!player.is_online) {
		tooltipMessage = "Este empleado no está en su puesto (Desconectado).";
		isUnclickable = true;
	} else if (isCardActive && isTargetingCard) {
		if (isOutOfRange) {
			tooltipMessage = "Demasiado lejos para tu rango actual.";
			isUnclickable = true;
		} else if (isUnstealable) {
			tooltipMessage = "No tiene documentos que robar.";
			isUnclickable = true;
		} else if (isAlreadyBlocked) {
			tooltipMessage = "Ya tiene un bloqueo activo.";
			isUnclickable = true;
		} else if (isSabotageUntargetable) {
			tooltipMessage = "No tiene cartas que descartar.";
			isUnclickable = true;
		}
	}

	const canBeTargeted = isCardActive && isTargetingCard && !isUnclickable;
	const isCleanMode = selectedCardType === 12 && isMyTurn;
	const canCleanGlobally = isCleanMode && !player.is_dead && player.is_online;

	const initials = player.name.substring(0, 2).toUpperCase();

	const renderPerkSlot = (slot: OpponentPerkSlot) => {
		if (slot.isEmpty) {
			return (
				<div
					key={slot.id}
					title={slot.title}
					className="flex items-center justify-center w-8 h-8 text-[10px] text-gray-500 font-mono bg-[#e5e7e4] rounded-sm border border-dashed border-gray-400"
				>
					{slot.icon}
				</div>
			);
		}

		return (
			<div
				key={slot.id}
				title={canCleanGlobally ? "Clic para anular acreditación" : slot.title}
				onClick={(e) => {
					e.stopPropagation();
					if (canCleanGlobally) {
						onAction(player.name, player.is_online, slot.id);
					} else if (slot.cardType !== undefined) {
						setInfoCard({
							id: slot.id,
							type: slot.cardType,
							name: slot.name ?? slot.title,
							description: slot.title,
						});
					}
				}}
				className={`flex items-center justify-center w-8 h-8 text-white text-[16px] font-bold rounded-sm shadow-sm transition-all hover:scale-110 ${
					canCleanGlobally
						? "cursor-pointer animate-pulse ring-2 ring-red-500 bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.8)] z-50 relative"
						: "cursor-help bg-[#393e42] border border-[#295c60]"
				}`}
			>
				{slot.icon}
			</div>
		);
	};

	return (
		<div
			onClick={() => {
				if (isUnclickable) return;
				if (selectedCardType === 12) return;
				onAction(player.name, player.is_online);
			}}
			className={`
                ${styles.cardBase}
                ${isThisOpponentTurn ? "ring-4 ring-[#cbbe34] shadow-[0_0_20px_rgba(203,190,52,0.6)] -translate-y-2" : ""}
                ${!player.is_online ? "opacity-50 grayscale scale-95" : ""}
                ${player.is_dead ? "opacity-40 grayscale scale-95 border-red-900 shadow-none" : ""}
                ${isUnclickable && !player.is_dead && player.is_online ? "opacity-50 grayscale scale-95" : ""}
                ${canBeTargeted ? "cursor-crosshair hover:scale-110 ring-4 ring-blue-500 shadow-[0_0_25px_rgba(59,130,246,0.8)]" : isUnclickable ? "cursor-not-allowed" : "cursor-default"}
            `}
			title={tooltipMessage || undefined}
		>

			{/* --- SELLO DORADO DEL JEFE (Fuera de la foto) --- */}
			{player.role === "boss" && (
				<div
					className={styles.goldSeal}
					title="Este jugador tiene el rol de Jefe"
				>
					👑
				</div>
			)}

			{/* --- RANURA DEL LANYARD (Tarjeta) --- */}
			<div className="w-12 h-2 bg-gray-900/10 rounded-full border border-gray-300/50 mb-3 shadow-inner relative z-20"></div>

			{/* --- INDICADORES VISUALES FLOTANTES --- */}
			{!player.is_dead && player.is_online && (
				<div
					className="absolute top-3 left-2 text-[11px] text-[#393e42] font-black bg-gray-200 px-1.5 py-0.5 rounded shadow-sm border border-gray-300"
					title={`Distancia física: ${player.distance}`}
				>
					📍 {player.distance}m
				</div>
			)}

			{!player.is_online && (
				<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded shadow-lg z-50 rotate-[-15deg] uppercase border border-red-800 whitespace-nowrap">
					En descanso
				</div>
			)}

			{player.is_dead && (
				<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black text-red-600 text-sm font-black px-4 py-2 rounded shadow-lg z-50 rotate-20 uppercase border-2 border-red-800 whitespace-nowrap">
					CESADO 💀
				</div>
			)}

			{isPlayerBlocked && (
				<div
					className="absolute top-3 right-2 text-[14px] drop-shadow-md z-50"
					title="Bloqueo temporal activo"
				>
					🔒
				</div>
			)}

			{/* --- FOTO DE EMPLEADO --- */}
			<div className={styles.photoBox}>
				<span className="text-3xl font-black text-gray-400 opacity-50">
					{initials}
				</span>
			</div>

			{/* --- INFORMACIÓN DEL EMPLEADO --- */}
			<h3 className="font-black text-[#393e42] text-sm truncate w-full uppercase mb-0.5">
				{player.name}
			</h3>

			<p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest border-b border-gray-300 pb-2 mb-2 w-full">
				ID: {Math.floor(Math.random() * 9000) + 1000}
			</p>

			{/* --- MÉTRICAS IMPORTANTES --- */}
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

			{/* --- BANDEJA DE EQUIPAMIENTO --- */}
			<div className="w-full bg-[#393e42]/5 border-t border-gray-300 pt-2 flex justify-center gap-2">
				{opponentPerks.map(renderPerkSlot)}
			</div>

			{/* --- TEMPORIZADOR DEL TURNO --- */}
			{isThisOpponentTurn &&
				turnTimeLeft !== null &&
				turnTimeLeft !== undefined && (
					<div className="absolute -bottom-4 bg-[#1a1a1a] border-2 border-[#cbbe34] text-[#cbbe34] text-xs font-black px-4 py-1 rounded shadow-lg z-20 whitespace-nowrap">
						{isTurnPaused ? (
							<span className="text-white animate-pulse">PAUSA</span>
						) : (
							`0:${turnTimeLeft.toString().padStart(2, "0")}`
						)}
					</div>
				)}

			{/* Modal de Info */}
			{infoCard && (
				<CardInfoModal card={infoCard} onClose={() => setInfoCard(null)} />
			)}
		</div>
	);
}
