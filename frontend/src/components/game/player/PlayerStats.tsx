// src/components/game/player/PlayerStats.tsx

import type { MyData } from "../../../types/live-game";
import { usePlayerStats } from "../../../hooks/game/usePlayerPerks";
import { useState } from "react";
import { CardInfoModal } from "../overlays/CardInfoModal.tsx";
import { PlayerTimer } from "./PlayerTimer.tsx";
import { PerkSlot } from "./PerkSlot.tsx"; // NUEVO IMPORT
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
	const { roleConfig, displayPerks, hasAnyCondition, myRange } =
		usePlayerStats(me);
	const [infoCard, setInfoCard] = useState<CardInstance | null>(null);

	return (
		<div className="relative w-full h-full">
			{/* Temporizador Escritorio (Se oculta en móvil) */}
			<PlayerTimer
				turnTimeLeft={turnTimeLeft}
				isTurnPaused={isTurnPaused}
				className="hidden lg:block absolute -top-6 -right-4 z-30"
			/>

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
					<span className={styles.formLabel}>Rol</span>
					<span className={`${styles.formValue} ${roleConfig.color}`}>
						{roleConfig.label}
					</span>
				</div>

				<div className={styles.formRow}>
					<span className={styles.formLabel}>Estrés</span>
					<span
						className={`${styles.formValue} ${me.stress > 0 ? "text-red-600" : ""}`}
					>
						{me.stress} / {me.max_stress}
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

				<div className={`${styles.formRow} items-center pb-1 mb-2 border-none`}>
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
								<PerkSlot
									key={perk.id}
									id={perk.id}
									icon={perk.icon}
									title={perk.title}
									cardType={perk.cardType}
									name={perk.name}
									isUnderSabotage={me.conditions.must_discard}
									onInfoClick={(id, type, name, desc) =>
										setInfoCard({ id, type, name, description: desc })
									}
								/>
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
								title="Sancionado"
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
