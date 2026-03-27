// frontend/src/components/game/board/OpponentCard.tsx
import type { Opponent } from "../../../types/live-game.ts";
import {
	useOpponentPerks,
	type OpponentPerkSlot,
} from "../../../hooks/game/useOpponentPerks.ts";

interface OpponentCardProps {
	player: Opponent;
	isMyTurn: boolean;
	selectedCardId: string | null;
	selectedCardType: number | null;
	onAction: (targetName: string, isOnline: boolean, perkKey?: string) => void;
}

export function OpponentCard({
	player,
	isMyTurn,
	selectedCardId,
	selectedCardType,
	onAction,
}: OpponentCardProps) {
	const opponentPerks = useOpponentPerks(player);

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
		tooltipMessage = "Este jugador está muerto.";
		isUnclickable = true;
	} else if (!player.is_online) {
		tooltipMessage = "Este jugador está desconectado.";
		isUnclickable = true;
	} else if (isCardActive && isTargetingCard) {
		if (isOutOfRange) {
			tooltipMessage = "Este jugador está fuera de tu alcance visual.";
			isUnclickable = true;
		} else if (isUnstealable) {
			tooltipMessage = "Este jugador no tiene cartas.";
			isUnclickable = true;
		} else if (isAlreadyBlocked) {
			tooltipMessage = "Este jugador ya está bloqueado.";
			isUnclickable = true;
		} else if (isSabotageUntargetable) {
			tooltipMessage = "Este jugador no tiene cartas que descartar.";
			isUnclickable = true;
		}
	}

	const canBeTargeted = isCardActive && isTargetingCard && !isUnclickable;
	const isCleanMode = selectedCardType === 12 && isMyTurn;
	const canCleanGlobally =
		isCleanMode && !player.is_dead && player.is_online;

	// --- HELPER PARA DIBUJAR PERKS EN LA BANDEJA ---
	const renderPerkSlot = (slot: OpponentPerkSlot) => {
		if (slot.isEmpty) {
			return (
				<div
					key={slot.id}
					title={slot.title}
					className="flex items-center justify-center w-7 h-7 text-xs text-gray-600 font-mono bg-gray-900 rounded border border-gray-700/50"
				>
					{slot.icon}
				</div>
			);
		}

		return (
			<div
				key={slot.id}
				title={
					canCleanGlobally
						? "Clic para descartar este equipamiento"
						: slot.title
				}
				onClick={(e) => {
					if (canCleanGlobally) {
						e.stopPropagation();
						onAction(player.name, player.is_online, slot.id);
					}
				}}
				className={`flex items-center justify-center w-8 h-8 text-white text-[14px] font-bold rounded shadow-sm transition-all hover:scale-110 ${
					canCleanGlobally
						? "cursor-pointer animate-pulse ring-1 ring-red-500 bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.8)] z-50 relative"
						: `cursor-help border border-gray-600`
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
			className={`relative bg-gray-800 p-4 rounded-lg border-2 w-48 flex flex-col items-center text-center shadow-xl z-10 transition-all
                ${player.role === "boss" ? "border-yellow-600" : "border-gray-700"}
                ${!player.is_online ? "opacity-40 grayscale scale-95" : ""}
                ${player.is_dead ? "opacity-50 grayscale scale-95 border-red-900" : ""}
                ${isUnclickable && !player.is_dead && player.is_online ? "opacity-30 grayscale scale-95" : ""}
                ${canBeTargeted ? "cursor-crosshair hover:scale-105 hover:border-blue-400 hover:shadow-blue-500/50" : isUnclickable || selectedCardType === 12 ? "cursor-default" : "cursor-default"}
            `}
			title={tooltipMessage || undefined}
		>
			{/* Indicador de Distancia */}
			{!player.is_dead && player.is_online && (
				<div
					className="absolute top-1 left-2 text-[10px] text-gray-500 font-mono"
					title={`Distancia del jugador: ${player.distance}`}
				>
					📍 {player.distance}
				</div>
			)}

			{/* Indicadores visuales */}
			{!player.is_online && (
				<div
					title="Este jugador ha abandonado la partida"
					className="absolute -top-3 -right-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded shadow-lg animate-pulse z-50"
				>
					🔌 OFFLINE
				</div>
			)}

			{player.role === "boss" && (
				<div
					title="Este jugador es el jefe"
					className="absolute -top-6 left-1/2 -translate-x-1/2 text-3xl drop-shadow-lg z-40"
				>
					👑
				</div>
			)}

			{player.is_dead && (
				<div
					title="Este jugador ha sido derrotado"
					className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gray-900 text-red-500 text-xs font-bold px-2 py-1 rounded shadow-lg z-50 border border-red-800"
				>
					💀
				</div>
			)}

			{isPlayerBlocked && (
				<div
					title="Este jugador tiene un bloqueo"
					className="absolute -top-3 right-6 bg-purple-700 text-white text-xs font-bold px-2 py-1 rounded shadow-lg z-50"
				>
					🔒
				</div>
			)}

			{/* Información del Jugador */}
			<h3
				className={`font-bold truncate w-full ${!player.is_online ? "text-gray-500" : "text-white"}`}
			>
				{player.name}
			</h3>

			<div className="mt-3 bg-gray-900 rounded p-2 border border-gray-700 w-full">
				<p className="text-xs text-gray-500 uppercase">Estrés</p>
				<p
					className={`text-lg font-black ${!player.is_online ? "text-gray-600" : "text-red-500"}`}
				>
					{player.stress}
				</p>
			</div>

			<div className="mt-2 text-xs text-blue-300 w-full flex justify-center items-center px-1">
				<span>
					Cartas:{" "}
					<span className="font-mono text-blue-200">{player.cards_count}</span>
				</span>
			</div>

			{/* --- BANDEJA DE EQUIPAMIENTO (3 SLOTS) --- */}
			<div className="mt-3 w-full">
				<div className="flex justify-center items-center gap-1.5">
					{opponentPerks.map(renderPerkSlot)}
				</div>
			</div>
		</div>
	);
}
