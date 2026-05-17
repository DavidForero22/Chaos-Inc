// src/components/game/player/PlayerStats.tsx
// Accesibilidad comprobada: SI

import type { MyData } from "../../../types/live-game";
import { usePlayerStats } from "../../../hooks/game/usePlayerPerks";
import { useState } from "react";
import { CardInfoModal } from "../overlays/CardInfoModal.tsx";
import { PlayerTimer } from "./PlayerTimer.tsx";
import { PerkSlot } from "./PerkSlot.tsx";
import type { CardInstance } from "../../../types/live-game";
import styles from "./PlayerStats.module.css";


interface PlayerStatsProps {
	me: MyData;
	turnTimeLeft?: number | null;
	isTurnPaused?: boolean;
	isVisible?: boolean;
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
		<section
			aria-label="Estadísticas de tu personaje"
			className="relative w-full h-full"
		>
			{/* Temporizador Escritorio */}
			<PlayerTimer
				turnTimeLeft={turnTimeLeft}
				isTurnPaused={isTurnPaused}
				className="hidden lg:block absolute -top-6 -right-4 z-30"
			/>

			{/* Documento de stats */}
			<article
				className={`${styles.documentContainer} overflow-y-auto no-scrollbar ${me.is_dead ? "grayscale opacity-80" : ""}`}
			>
				<div aria-hidden="true" className={styles.paperClip}></div>

				{/* Aviso para lectores de pantalla si está muerto */}
				{me.is_dead && (
					<>
						<span className="sr-only">
							Estado actual: Muerto. Estás eliminado de la partida.
						</span>
						<div aria-hidden="true" className={styles.stampDead}>
							MUERTO
						</div>
					</>
				)}

				{/* Cabecera del Documento */}
				<header className="text-center border-b-2 border-[#393e42] pb-1 mb-4">
					<h3 className="font-black text-lg truncate uppercase mt-1">
						{me.name}
					</h3>
				</header>

				{/* Campos  */}
				<dl className="m-0 p-0">
					<div className={styles.formRow}>
						<dt className={styles.formLabel}>Rol</dt>
						<dd className={`${styles.formValue} ${roleConfig.color} m-0`}>
							{roleConfig.label}
						</dd>
					</div>

					<div className={styles.formRow}>
						<dt className={styles.formLabel}>Estrés</dt>
						<dd
							className={`${styles.formValue} ${me.stress > 0 ? "text-red-600" : ""} m-0`}
						>
							{me.stress} / {me.max_stress}
						</dd>
					</div>

					<div className={styles.formRow}>
						<dt className={styles.formLabel}>Alcance</dt>
						<dd className={`${styles.formValue} m-0`}>
							{/* Texto oculto para explicar el alcance en lugar de usar title */}
							<span className="sr-only">
								Puedes atacar a oponentes a una distancia de{" "}
							</span>
							{myRange}
						</dd>
					</div>

					<div
						className={`${styles.formRow} items-center pb-1 mb-2 border-none`}
					>
						<dt className={styles.formLabel}>Pasivas</dt>
						<dd className="m-0 w-full">
							{/* Lista semántica para las pasivas */}
							<ul
								aria-label="Tus pasivas equipadas"
								className="flex gap-3 items-center justify-baseline m-0 p-0 list-none"
							>
								{displayPerks.map((perk) =>
									perk.isEmpty ? (
										<li key={perk.id}>
											<span
												aria-label="Ranura de pasiva vacía"
												className={`${styles.perkSlot} ${styles.perkSlotEmpty} w-7 h-7 text-sm flex items-center justify-center`}
											>
												<span aria-hidden="true">{perk.icon}</span>
											</span>
										</li>
									) : (
										<li
											key={perk.id}
											className="transform scale-125 lg:scale-100 origin-center"
										>
											<PerkSlot
												id={perk.id}
												icon={perk.icon}
												title={perk.title}
												cardType={perk.cardType}
												name={perk.name}
												isUnderSabotage={me.conditions.must_discard}
												onInfoClick={(id, type, name, desc) =>
													setInfoCard({
														id: id,
														card_id: 0,
														type: type as any,
														target: "none",
														base_name: "Pasiva",
														name: name,
														description: desc,
														lore: "",
														icons: [],
													})
												}
											/>
										</li>
									),
								)}
							</ul>
						</dd>
					</div>
				</dl>

				{/* Notas de Estado */}
				<div className="mt-2">
					<h4
						id="status-heading"
						className={`${styles.formLabel} mb-1.5 flex items-center gap-2 m-0 text-base`}
					>
						Estado
					</h4>

					{/* Lista semántica para los estados */}
					<ul
						aria-labelledby="status-heading"
						className="flex flex-wrap gap-2 text-lg min-h-6 items-center m-0 p-0 list-none"
					>
						{me.conditions.is_blocked && (
							<li>
								<span className="cursor-help bg-purple-100 border border-purple-300 rounded px-1.5 py-0.5 text-xs font-bold relative group">
									<span aria-hidden="true">🔒</span> BLOQUEADO
									<span className="sr-only">
										Sancionado. No puedes realizar acciones.
									</span>
								</span>
							</li>
						)}

						{me.conditions.skip_next_turn && (
							<li>
								<span className="cursor-help bg-orange-100 border border-orange-400 text-orange-800 rounded px-1.5 py-0.5 text-xs font-bold relative group">
									<span aria-hidden="true">⏳</span> PENALIZADO
									<span className="sr-only">
										Penalizado por inactividad. Perderás tu próximo turno.
									</span>
								</span>
							</li>
						)}

						{me.conditions.acting_boss && (
							<li>
								<span className="cursor-help bg-yellow-100 border border-yellow-400 rounded px-1.5 py-0.5 text-xs font-bold relative group">
									<span aria-hidden="true">👑</span> INTERINO
									<span className="sr-only">
										Jefe en Funciones. Asumes el rol de jefe temporalmente.
									</span>
								</span>
							</li>
						)}

						{!hasAnyCondition && !me.conditions.skip_next_turn && (
							<li>
								<span className="text-gray-500 text-xs italic">
									Sin estados.
								</span>
							</li>
						)}
					</ul>
				</div>
			</article>

			{infoCard && (
				<CardInfoModal card={infoCard} onClose={() => setInfoCard(null)} />
			)}
		</section>
	);
}
