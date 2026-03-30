// frontend/src/components/game/player/PlayerStats.tsx
import type { MyData } from "../../../types/live-game";
import { useGameStore } from "../../../store/useGameStore";
import { useGameUIStore } from "../../../store/useGameUIStore";
import { usePlayerStats } from "../../../hooks/game/usePlayerPerks";
import { useState } from "react";
import { CardInfoModal } from "../overlays/CardInfoModal.tsx";
import type { CardInstance } from "../../../types/live-game";

interface PlayerStatsProps {
	me: MyData;
	turnTimeLeft?: number | null;
}

export function PlayerStats({ me, turnTimeLeft }: PlayerStatsProps) {
	const { isDiscardMode, perksToDiscard, toggleDiscardPerk } = useGameUIStore();
	const { roleConfig, displayPerks, hasAnyCondition, myRange } =
		usePlayerStats(me);
	const [infoCard, setInfoCard] = useState<CardInstance | null>(null);

	const gameData = useGameStore((state) => state.gameData);

	const renderDiscardablePerk = (
		id: string,
		icon: string,
		title: string,
		cardType: number,
		name: string,
	) => {
		const isMarked = perksToDiscard.includes(id);

		const baseClasses =
			"flex items-center justify-center w-8 h-8 relative transition-transform bg-gray-800 rounded border border-gray-500/50";
		let modeClasses = "cursor-help hover:scale-110";

		if (isDiscardMode) {
			modeClasses = isMarked
				? "cursor-pointer scale-110 ring-2 ring-red-500 rounded bg-red-900/30"
				: "cursor-pointer hover:scale-110 animate-pulse bg-gray-800 rounded border border-red-500/50";
		}

		return (
			<span
				key={id}
				title={isDiscardMode ? "Clic para descartar" : title}
				className={`${baseClasses} ${modeClasses}`}
				onClick={() => {
					if (isDiscardMode) {
						toggleDiscardPerk(id);
					} else if (cardType !== undefined) {
						setInfoCard({
							id,
							type: cardType,
							name,
							description: title,
						});
					}
				}}
			>
				{icon}
			</span>
		);
	};

	const game = gameData?.game;
	const isMyTurn = game?.current_turn === me.name;

	// Verificar si hay otra reacción obligatoria
	const hasActiveReaction =
		game?.pending_single_attack_target === me.name ||
		game?.pending_multi_attack_targets.includes(me.name) ||
		game?.player_pending_sabotage === me.name ||
		game?.player_in_luck_challenge === me.name;

	// Solo se mostrar en su turno, sin reaccion a nada, y hay tiempo válido
	const shouldShowTimer =
		isMyTurn &&
		!hasActiveReaction &&
		turnTimeLeft !== undefined &&
		turnTimeLeft !== null;
	const isLowTime =
		turnTimeLeft !== undefined && turnTimeLeft !== null && turnTimeLeft <= 10;

	return (
		<div>
			{/* Banner temporizador*/}
			{shouldShowTimer && (
				<div
					className={`absolute w-21 top-3 z-0 left-7 px-4 py-1 rounded-t-lg border-t border-x font-bold text-sm shadow-lg flex items-center gap-2 transition-colors ${
						isLowTime
							? "bg-red-900 border-red-500 text-red-200 animate-pulse"
							: "bg-gray-800 border-blue-500 text-blue-300"
					}`}
				>
					⏳ {turnTimeLeft}s
				</div>
			)}
			<div className="relative bg-gray-900 p-4 rounded-lg border border-gray-700 min-w-50 mt-4">
				{/* ---------------------------------- */}

				{/* Nombre */}
				<h3
					className={`font-bold truncate mb-3 ${me.is_dead ? "text-red-500 line-through" : "text-blue-400"}`}
				>
					{me.name} (Tú) {me.is_dead && "💀"}
				</h3>

				{/* Rol */}
				<div className="flex justify-between items-center mb-2 gap-4">
					<span className="text-xs text-gray-500 uppercase">Rol</span>
					<span className={`text-sm font-bold ${roleConfig.color}`}>
						{roleConfig.label}
					</span>
				</div>

				{/* Estrés */}
				<div className="flex justify-between items-center">
					<span className="text-xs text-gray-500 uppercase">Estrés</span>
					<span className="text-sm font-bold text-red-500">{me.stress}</span>
				</div>

				{/* Alcance */}
				<div className="flex justify-between items-center mt-2">
					<span className="text-xs text-gray-500 uppercase">Alcance</span>
					<span
						className="text-sm font-bold text-blue-300 flex items-center gap-1"
						title="A cuántos compañeros de distancia puedes atacar"
					>
						👁️ {myRange}
					</span>
				</div>

				{/* PASIVAS */}
				<div className="flex justify-between items-center mt-2 pt-2 border-t h-10 border-gray-800">
					<span className="text-xs uppercase text-gray-500">Pasivas</span>

					{/* Contenedor alineado a la derecha */}
					<div className="flex gap-1 text-lg items-center">
						{displayPerks.map((perk) =>
							perk.isEmpty ? (
								// Renderizar el slot vacío
								<span
									key={perk.id}
									title={perk.title}
									className="flex items-center justify-center w-8 h-8 text-gray-600 font-mono bg-gray-900 rounded border border-gray-700/50"
								>
									{perk.icon}
								</span>
							) : (
								// Renderizar el Perk interactivo
								renderDiscardablePerk(
									perk.id,
									perk.icon,
									perk.title,
									perk.cardType!,
									perk.name!,
								)
							),
						)}
					</div>
				</div>

				{/* ESTADOS */}
				<div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-800 h-8">
					<span className="text-xs text-gray-500 uppercase">Estado</span>
					<div className="flex gap-2 text-lg">
						{me.conditions.is_blocked && (
							<span
								title="Bloqueado: No puedes jugar en tu turno."
								className="cursor-help hover:scale-110 transition-transform"
							>
								🔒
							</span>
						)}
						{me.conditions.acting_boss && (
							<span
								title="Jefe en Funciones: Has heredado el poder de la directiva."
								className="cursor-help hover:scale-110 transition-transform"
							>
								👑
							</span>
						)}
						{!hasAnyCondition && (
							<span className="text-gray-600 text-xs font-mono">-</span>
						)}
					</div>
				</div>
			</div>

			{infoCard && (
				<CardInfoModal card={infoCard} onClose={() => setInfoCard(null)} />
			)}
		</div>
	);
}
