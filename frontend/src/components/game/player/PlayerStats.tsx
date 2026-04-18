// frontend/src/components/game/player/PlayerStats.tsx
import type { MyData } from "../../../types/live-game";
import { useGameStore } from "../../../store/useGameStore";
import { useGameUIStore } from "../../../store/useGameUIStore";
import { usePlayerStats } from "../../../hooks/game/usePlayerPerks";
import { useState } from "react";
import { CardInfoModal } from "../overlays/CardInfoModal.tsx";
import type { CardInstance } from "../../../types/live-game";
import styles from "./PlayerStats.module.css";

interface PlayerStatsProps {
	me: MyData;
	turnTimeLeft?: number | null;
	isTurnPaused?: boolean;
}

export function PlayerStats({
	me,
	turnTimeLeft,
	isTurnPaused = false,
}: PlayerStatsProps) {
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
		const isUnderSabotage = me.conditions.must_discard;

		let modeClasses = "cursor-help hover:scale-110";

		if (isDiscardMode && !isUnderSabotage) {
			modeClasses = isMarked
				? "cursor-pointer scale-110 ring-2 ring-red-600 bg-red-100 text-red-600 border-red-600"
				: "cursor-pointer hover:scale-110 animate-pulse border-[#295c60] text-[#295c60]";
		}

		return (
			<span
				key={id}
				title={
					isDiscardMode && !isUnderSabotage
						? "Clic para anular acreditación"
						: title
				}
				className={`${styles.perkSlot} ${modeClasses} transition-all w-7 h-7 text-sm`}
				onClick={() => {
					if (isDiscardMode && !isUnderSabotage) {
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

	const hasActiveReaction =
		game?.pending_single_attack_target === me.name ||
		game?.pending_multi_attack_targets.includes(me.name) ||
		game?.player_pending_sabotage === me.name ||
		game?.player_in_luck_challenge === me.name;

	const shouldShowTimer =
		isMyTurn &&
		!hasActiveReaction &&
		turnTimeLeft !== undefined &&
		turnTimeLeft !== null;

	const isLowTime =
		turnTimeLeft !== undefined && turnTimeLeft !== null && turnTimeLeft <= 10;

	return (
		<div className="relative w-full h-full">
			{/* Banner temporizador estilo Post-it */}
			{shouldShowTimer && (
				<div
					className={`absolute -top-6 -right-4 z-30 px-3 py-1 font-bold text-sm shadow-md transform rotate-[5deg] transition-colors border ${
						isTurnPaused
							? "bg-gray-300 border-gray-400 text-gray-700"
							: isLowTime
								? "bg-red-200 border-red-400 text-red-800 animate-pulse"
								: "bg-[#cbbe34] border-[#a89d2b] text-black"
					}`}
				>
					{isTurnPaused ? "PAUSA" : `⏳ ${turnTimeLeft}s`}
				</div>
			)}

			{/* Documento de RRHH */}
			<div
				className={`${styles.documentContainer} ${me.is_dead ? "grayscale opacity-80" : ""}`}
			>
				<div className={styles.paperClip}></div>

				{me.is_dead && <div className={styles.stampDead}>CESADO</div>}

				{/* Cabecera del Documento */}
				<div className="text-center border-b-2 border-[#393e42] pb-1 mb-4">
					<h3 className="font-black text-lg truncate uppercase mt-1">
						{me.name}
					</h3>
				</div>

				{/* Campos */}
				<div className={styles.formRow}>
					<span className={styles.formLabel}>Posición</span>
					<span className={`${styles.formValue} ${roleConfig.color}`}>
						{roleConfig.label}
					</span>
				</div>

				<div className={styles.formRow}>
					<span className={styles.formLabel}>Estrés Actual</span>
					<span
						className={`${styles.formValue} ${me.stress > 0 ? "text-red-600" : ""}`}
					>
						{me.stress} / 10
					</span>
				</div>

				<div className={styles.formRow}>
					<span className={styles.formLabel}>Alcance</span>
					<span
						className={styles.formValue}
						title={`Puedes atacar a oponentes a ${myRange} de distancia`}
					>
						{myRange}
					</span>
				</div>

				{/* Pasivas (En línea y alineadas a la derecha) */}
				<div
					className={`${styles.formRow} items-center  pb-1 mb-2 border-none`}
				>
					<span className={styles.formLabel}>Pasivas</span>
					<div className="flex gap-1 items-center justify-baseline">
						{displayPerks.map((perk) =>
							perk.isEmpty ? (
								<span
									key={perk.id}
									title={perk.title}
									className={`${styles.perkSlot} ${styles.perkSlotEmpty} w-7 h-7 text-sm`}
								>
									{perk.icon}
								</span>
							) : (
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

				{/* Notas de Estado */}
				<div className="mt-1">
					<span className={`${styles.formLabel} block mb-0.5`}>Estado</span>
					<div className="flex gap-2 text-lg min-h-6 items-center">
						{me.conditions.is_blocked && (
							<span
								title="Sancionado: No puedes actuar en tu proximo turno"
								className="cursor-help bg-purple-100 border border-purple-300 rounded px-1.5 py-0.5 text-xs font-bold"
							>
								🔒 SANCIONADO
							</span>
						)}
						{me.conditions.acting_boss && (
							<span
								title="Jefe en Funciones"
								className="cursor-help bg-yellow-100 border border-yellow-400 rounded px-1.5 py-0.5 text-xs font-bold"
							>
								👑 INTERINO
							</span>
						)}
						{!hasAnyCondition && (
							<span className="text-gray-500 text-xs italic">Sin estados.</span>
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
