// src/components/profile/GraphsProfile.tsx
// Accesibilidad comprobada: SI

import { useState } from "react";
import type { GameRecord } from "../../../types/api.ts";
import { useProfileStats } from "../../../hooks/profile/useProfileStats.ts";
import styles from "./GraphsProfile.module.css";
import viewStyles from "../RegisteredProfileView.module.css";
import RadarChart from "./graphs/RadarChart";
import DoughnutChart from "./graphs/DoughnutChart";
import WinrateChart from "./graphs/WinrateChart";
import TopCardsChart from "./graphs/TopCardsChart";
import AliveDeadChart from "./graphs/AliveDeadChart";

interface GraphsProfileProps {
	games: GameRecord[];
	user: string | null | undefined;
}

export default function GraphsProfile({ games, user }: GraphsProfileProps) {
	const [isExpanded, setIsExpanded] = useState(false);
	const stats = useProfileStats(games, user);
	const {
		basicStats,
		radarData,
		roleDistribution,
		winrateByRole,
		topCards,
		aliveDeadData,
		totalGames,
	} = stats;

	return (
		<section aria-labelledby="stats-title">
			<h1 className={viewStyles.sectionTitle} id="stats-title">
				ESTADÍSTICAS DEL JUGADOR
			</h1>

			<div className={viewStyles.section}>
				{/* ── KPIs como lista de definición ── */}
				<dl className={styles.statsGrid}>
					<div className={styles.statRow}>
						<dt className={styles.statLabel}>PARTIDAS JUGADAS:</dt>
						<dd className={styles.statValue}>{totalGames}</dd>
					</div>
					<div className={styles.statRow}>
						<dt className={styles.statLabel}>VICTORIAS REGISTRADAS:</dt>
						<dd className={`${styles.statValue} ${styles.statValueHighlight}`}>
							{basicStats.wins}
						</dd>
					</div>
					<div className={styles.statRow}>
						<dt className={styles.statLabel}>JUGADORES ELIMINADOS:</dt>
						<dd className={styles.statValue}>{basicStats.eliminations}</dd>
					</div>
					<div className={styles.statRow}>
						<dt className={styles.statLabel}>DERROTAS REGISTRADAS:</dt>
						<dd className={styles.statValue}>{totalGames - basicStats.wins}</dd>
					</div>
					<div className={styles.statRow}>
						<dt className={styles.statLabel}>DAÑO INFLIGIDO (TOTAL):</dt>
						<dd className={styles.statValue}>{basicStats.damage}</dd>
					</div>
					<div className={styles.statRow}>
						<dt className={styles.statLabel}>DAÑO RECIBIDO (TOTAL):</dt>
						<dd className={styles.statValue}>{basicStats.received}</dd>
					</div>
					<div className={styles.statRow}>
						<dt className={styles.statLabel}>CARTAS USADAS:</dt>
						<dd className={styles.statValue}>{basicStats.cards}</dd>
					</div>
					<div className={styles.statRow}>
						<dt className={styles.statLabel}>CURACIÓN APLICADA (TOTAL):</dt>
						<dd className={styles.statValue}>{basicStats.healing}</dd>
					</div>
				</dl>

				{/* ── Botón de expansión con aria ── */}
				<button
					className={styles.expandBtn}
					onClick={() => setIsExpanded((v) => !v)}
					aria-expanded={isExpanded}
					aria-controls="advanced-stats"
				>
					{isExpanded
						? "[-] CERRAR ESTADÍSTICAS AVANZADAS"
						: "[+] ABRIR ESTADÍSTICAS AVANZADAS"}
				</button>

				{/* ── Contenedor expandible con animación fluida ── */}
				<div
					id="advanced-stats"
					className={`${styles.expandableWrapper} ${isExpanded ? styles.open : ""}`}
					role="region"
					aria-label="Estadísticas avanzadas"
					aria-hidden={!isExpanded}
				>
					<div className={styles.expandedContentInner}>
						<div className={styles.chartsContainer}>
							{totalGames === 0 ? (
								<div className={styles.noData} role="status" aria-live="polite">
									<span className={styles.noDataStamp}>SIN DATOS</span>
									<p className={styles.noDataText}>
										HISTORIAL VACÍO. NO SE HAN REGISTRADO PARTIDAS PARA GENERAR
										UN ANÁLISIS.
									</p>
									<p className={styles.noDataSub}>
										[ JUEGA AL MENOS UNA PARTIDA PARA PODER VISUALIZAR GRÁFICOS
										]
									</p>
								</div>
							) : (
								<>
									<div className={styles.chartsRow}>
										<RadarChart
											basicStats={basicStats}
											radarData={radarData}
											userName={user}
										/>
										<DoughnutChart
											roleDistribution={roleDistribution}
											totalGames={totalGames}
										/>
									</div>

									<div className={styles.chartsRow}>
										<WinrateChart winrateByRole={winrateByRole} />
										<AliveDeadChart
											aliveDeadData={aliveDeadData}
											totalGames={totalGames}
										/>
									</div>

									{topCards.length > 0 && (
										<div className={`${styles.chartBlock} ${styles.chartFull}`}>
											<TopCardsChart topCards={topCards} />
										</div>
									)}
								</>
							)}
						</div>
					</div>
				</div>

				<div className="sr-only" aria-live="polite" aria-atomic="true">
					{isExpanded
						? "Sección de estadísticas avanzadas abierta."
						: "Sección de estadísticas avanzadas cerrada."}
				</div>
			</div>
		</section>
	);
}
