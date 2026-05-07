import { useState } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import type { GameRecord } from "../../types/api";
import { useProfileStats } from "../../hooks/profile/useProfileStats.ts";
import { CARD_MAP } from "../../data/cards.ts";
import styles from "./GraphsProfile.module.css";
import viewStyles from "./RegisteredProfileView.module.css";

// ── Paleta temática ──────────────────────────────────────────────────────────
const C = {
	navy: "#1e3a8a",
	dark: "#2b2b2b",
	red: "#b91c1c",
	muted: "#6b7280",
	cream: "#f4ece1",
	roles: ["#1e3a8a", "#374151", "#b91c1c", "#92400e", "#064e3b", "#4c1d95"],
};

const ECHARTS_BASE: Partial<EChartsOption> = {
	backgroundColor: "transparent",
	textStyle: { fontFamily: "'Courier New', Courier, monospace", color: C.dark },
};

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

	// ── Opciones ECharts ─────────────────────────────────────────────────────

	const radarOption: EChartsOption = {
		...ECHARTS_BASE,
		radar: {
			indicator: [
				{ name: "AGRESIVIDAD", max: 100 },
				{ name: "SUPERVIVENCIA", max: 100 },
				{ name: "PRODUCTIVIDAD", max: 100 },
				{ name: "BAJAS", max: 100 },
				{ name: "PLANIFICACIÓN", max: 100 },
			],
			shape: "polygon",
			splitNumber: 4,
			axisName: {
				color: C.muted,
				fontSize: 9,
				fontWeight: 900,
				fontFamily: "'Courier New', Courier, monospace",
			},
			splitLine: { lineStyle: { color: "rgba(43,43,43,0.15)" } },
			splitArea: { show: false },
			axisLine: { lineStyle: { color: "rgba(43,43,43,0.2)" } },
		},
		series: [
			{
				type: "radar",
				data: [
					{
						value: radarData,
						name: user ?? "",
						areaStyle: { color: "rgba(30,58,138,0.15)" },
						lineStyle: { color: C.navy, width: 2 },
						itemStyle: { color: C.navy },
						symbol: "circle",
						symbolSize: 5,
					},
				],
			},
		],
	};

	const doughnutOption: EChartsOption = {
		...ECHARTS_BASE,
		legend: {
			orient: "vertical",
			right: "5%",
			top: "center",
			textStyle: {
				fontSize: 9,
				fontFamily: "'Courier New', Courier, monospace",
				color: C.dark,
			},
		},
		series: [
			{
				type: "pie",
				radius: ["42%", "68%"],
				center: ["38%", "50%"],
				label: {
					show: true,
					formatter: "{d}%",
					fontSize: 9,
					fontFamily: "'Courier New', Courier, monospace",
					fontWeight: 900,
				},
				labelLine: { length: 8, length2: 6 },
				data: roleDistribution.map(({ role, count }, i) => ({
					name: role,
					value: count,
					itemStyle: { color: C.roles[i % C.roles.length] },
				})),
			},
		],
	};

	const winrateOption: EChartsOption = {
		...ECHARTS_BASE,
		grid: { top: 10, bottom: 30, left: 90, right: 40 },
		xAxis: {
			type: "value",
			max: 100,
			axisLabel: {
				formatter: "{value}%",
				fontSize: 9,
				fontFamily: "'Courier New', Courier, monospace",
				color: C.muted,
			},
			splitLine: { lineStyle: { color: "rgba(43,43,43,0.1)" } },
		},
		yAxis: {
			type: "category",
			data: winrateByRole.map((r) => r.role),
			axisLabel: {
				fontSize: 9,
				fontWeight: 900,
				fontFamily: "'Courier New', Courier, monospace",
				color: C.dark,
			},
			axisTick: { show: false },
			axisLine: { show: false },
		},
		series: [
			{
				type: "bar",
				barMaxWidth: 18,
				data: winrateByRole.map((r, i) => ({
					value: r.winrate,
					label: {
						show: true,
						position: "right",
						formatter: `{c}% (${r.total}p)`,
						fontSize: 8,
						fontFamily: "'Courier New', Courier, monospace",
						color: C.muted,
					},
					itemStyle: { color: C.roles[i % C.roles.length] },
				})),
			},
		],
	};

	const topCardsOption: EChartsOption = {
		...ECHARTS_BASE,
		grid: { top: 10, bottom: 30, left: 140, right: 50 },
		xAxis: {
			type: "value",
			axisLabel: {
				fontSize: 9,
				fontFamily: "'Courier New', Courier, monospace",
				color: C.muted,
			},
			splitLine: { lineStyle: { color: "rgba(43,43,43,0.1)" } },
		},
		yAxis: {
			type: "category",
			data: [...topCards]
				.reverse()
				.map((c) => CARD_MAP[c.id] ?? `Carta #${c.id}`),
			axisLabel: {
				fontSize: 9,
				fontWeight: 900,
				fontFamily: "'Courier New', Courier, monospace",
				color: C.dark,
			},
			axisTick: { show: false },
			axisLine: { show: false },
		},
		series: [
			{
				type: "bar",
				barMaxWidth: 18,
				data: [...topCards].reverse().map((c) => ({
					value: c.count,
					label: {
						show: true,
						position: "right",
						formatter: "{c}x",
						fontSize: 9,
						fontWeight: 900,
						fontFamily: "'Courier New', Courier, monospace",
						color: C.dark,
					},
					itemStyle: { color: C.navy },
				})),
			},
		],
	};

	const aliveDeadOption: EChartsOption = {
		...ECHARTS_BASE,
		legend: {
			bottom: 0,
			textStyle: {
				fontSize: 9,
				fontFamily: "'Courier New', Courier, monospace",
				color: C.dark,
			},
		},
		series: [
			{
				type: "pie",
				radius: ["42%", "68%"],
				center: ["50%", "44%"],
				label: {
					show: true,
					formatter: "{b}\n{d}%",
					fontSize: 9,
					fontFamily: "'Courier New', Courier, monospace",
					fontWeight: 900,
				},
				labelLine: { length: 8, length2: 6 },
				data: [
					{
						name: "SOBREVIVIÓ",
						value: aliveDeadData.alive,
						itemStyle: { color: C.navy },
					},
					{
						name: "ELIMINADO",
						value: aliveDeadData.dead,
						itemStyle: { color: C.red },
					},
				],
			},
		],
	};

	// ── Render ───────────────────────────────────────────────────────────────
	return (
		<div className={viewStyles.section}>
			{/* ── KPIs ── */}
			<div className={styles.statsGrid}>
				<div className={styles.statRow}>
					<span className={styles.statLabel}>PARTIDAS JUGADAS:</span>
					<span className={styles.statValue}>{totalGames}</span>
				</div>
				<div className={styles.statRow}>
					<span className={styles.statLabel}>VICTORIAS REGISTRADAS:</span>
					<span className={`${styles.statValue} ${styles.statValueHighlight}`}>
						{basicStats.wins}
					</span>
				</div>
				<div className={styles.statRow}>
					<span className={styles.statLabel}>DERROTAS REGISTRADAS:</span>
					<span className={styles.statValue}>
						{totalGames - basicStats.wins}
					</span>
				</div>
				<div className={styles.statRow}>
					<span className={styles.statLabel}>JUGADORES ELIMINADOS:</span>
					<span className={styles.statValue}>{basicStats.eliminations}</span>
				</div>
				<div className={styles.statRow}>
					<span className={styles.statLabel}>DAÑO INFLIGIDO (TOTAL):</span>
					<span className={styles.statValue}>{basicStats.damage}</span>
				</div>
				<div className={styles.statRow}>
					<span className={styles.statLabel}>DAÑO RECIBIDO (TOTAL):</span>
					<span className={styles.statValue}>{basicStats.received}</span>
				</div>
				<div className={styles.statRow}>
					<span className={styles.statLabel}>PRODUCTIVIDAD (CARTAS):</span>
					<span className={styles.statValue}>{basicStats.cards}</span>
				</div>
				<div className={styles.statRow}>
					<span className={styles.statLabel}>CURACIÓN APLICADA (TOTAL):</span>
					<span className={styles.statValue}>{basicStats.healing}</span>
				</div>
			</div>

			{/* ── Botón expansión ── */}
			<button
				className={styles.expandBtn}
				onClick={() => setIsExpanded((v) => !v)}
			>
				{isExpanded
					? "[-] CERRAR ESTADÍSTICAS AVANZADAS"
					: "[+] ABRIR ESTADÍSTICAS AVANZADAS"}
			</button>

			{/* ── Contenedor expandible ── */}
			<div
				className={`${styles.expandableWrapper} ${isExpanded ? styles.open : ""}`}
			>
				<div className={styles.expandedContentInner}>
					<div className={styles.chartsContainer}>
						{totalGames === 0 ? (
							<div className={styles.noData}>
								<span className={styles.noDataStamp}>SIN DATOS</span>
								<p className={styles.noDataText}>
									HISTORIAL VACIO. NO SE HAN REGISTRADO PARTIDAS 
									PARA GENERAR UN ANÁLISIS.
								</p>
								<p className={styles.noDataSub}>
									[ JUEGA AL MENOS UNA PARTIDA PARA PODER VISUALIZAR GRÁFICOS ]
								</p>
							</div>
						) : (
							<>
								{/* Fila 1: Radar + Doughnut */}
								<div className={styles.chartsRow}>
									<div className={styles.chartBlock}>
										<p className={styles.chartTitle}>— PERFIL DE AGENTE —</p>
										<ReactECharts
											option={radarOption}
											style={{ height: 220 }}
											opts={{ renderer: "svg" }}
										/>
									</div>
									<div className={styles.chartBlock}>
										<p className={styles.chartTitle}>
											— DEPARTAMENTO HABITUAL —
										</p>
										<ReactECharts
											option={doughnutOption}
											style={{ height: 220 }}
											opts={{ renderer: "svg" }}
										/>
									</div>
								</div>

								{/* Fila 2: Winrate por rol + Vivo/Muerto */}
								<div className={styles.chartsRow}>
									<div className={styles.chartBlock}>
										<p className={styles.chartTitle}>
											— EFICACIA POR DEPARTAMENTO —
										</p>
										<ReactECharts
											option={winrateOption}
											style={{ height: 180 }}
											opts={{ renderer: "svg" }}
										/>
									</div>
									<div className={styles.chartBlock}>
										<p className={styles.chartTitle}>
											— TASA DE SUPERVIVENCIA —
										</p>
										<ReactECharts
											option={aliveDeadOption}
											style={{ height: 180 }}
											opts={{ renderer: "svg" }}
										/>
									</div>
								</div>

								{/* Fila 3: Top 5 cartas (ancho completo) */}
								{topCards.length > 0 && (
									<div className={`${styles.chartBlock} ${styles.chartFull}`}>
										<p className={styles.chartTitle}>
											— HERRAMIENTAS DE CONFIANZA (TOP 5) —
										</p>
										<ReactECharts
											option={topCardsOption}
											style={{ height: 180 }}
											opts={{ renderer: "svg" }}
										/>
									</div>
								)}
							</>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
