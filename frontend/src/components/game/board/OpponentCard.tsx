// frontend/src/components/game/board/OpponentCard.tsx

import type { Opponent } from "../../../types/live-game.ts";

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
	const hasShield = player.perks?.has_shield ?? (player as any).has_shield;
	const visionBonus = player.perks?.vision_bonus ?? 0;

	// --- HELPER PARA DIBUJAR PERKS INTERACTIVOS ---
	const renderOpponentPerk = (
		perkKey: string,
		icon: React.ReactNode,
		title: string,
		baseColor: string,
		positionClasses: string,
	) => {
		const isAuditMode = selectedCardType === 12 && isMyTurn;
		const canBeAudited = isAuditMode && !player.is_dead && player.is_online;

		return (
			<div
				title={
					canBeAudited
						? "Clic para auditar (destruir) este equipamiento"
						: title
				}
				onClick={(e) => {
					if (canBeAudited) {
						e.stopPropagation();
						onAction(player.name, player.is_online, perkKey);
					}
				}}
				className={`absolute ${positionClasses} text-white text-xs font-bold px-2 py-1 rounded shadow-lg z-50 flex items-center transition-all ${
					canBeAudited
						? "cursor-crosshair animate-pulse ring-2 ring-red-500 hover:scale-125 bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.8)]"
						: baseColor
				}`}
			>
				{icon}
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
			className={`relative bg-gray-800 p-4 rounded-lg border-2 w-48 text-center shadow-xl z-10 transition-all
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

			{hasShield &&
				renderOpponentPerk(
					"has_shield",
					"🛡️",
					"Este jugador tiene un escudo activo",
					"bg-cyan-700",
					"top-24 -left-3",
				)}

			{visionBonus > 0 &&
				renderOpponentPerk(
					"vision_bonus",
					visionBonus == 1 ? "👓" : "🔭",
					`Este jugador ve a +${visionBonus} de distancia`,
					"bg-blue-700",
					"top-8 -left-3",
				)}

			{player.perks.distance_bonus > 0 &&
				renderOpponentPerk(
					"distance_bonus",
					<span>🏠</span>,
					"Este jugador está a +1 de distancia",
					"bg-blue-500",
					"top-16 -left-3",
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

			<h3
				className={`font-bold truncate ${!player.is_online ? "text-gray-500" : "text-white"}`}
			>
				{player.name}
			</h3>

			<div className="mt-3 bg-gray-900 rounded p-2 border border-gray-700">
				<p className="text-xs text-gray-500 uppercase">Estrés</p>
				<p
					className={`text-lg font-black ${!player.is_online ? "text-gray-600" : "text-red-500"}`}
				>
					{player.stress}
				</p>
			</div>

			<div className="mt-2 text-xs text-blue-300">
				Cartas:{" "}
				<span className="font-mono text-blue-200">{player.cards_count}</span>
			</div>
		</div>
	);
}
