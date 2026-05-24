// src/components/profile/GraphsProfile.tsx
// Accesibilidad comprobada: SI

import { useState } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import type { GameRecord } from "../../../types/api.ts";
import { useProfileStats } from "../../../hooks/profile/useProfileStats.ts";
import styles from "./GraphsProfile.module.css";
import viewStyles from "../RegisteredProfileView.module.css";

// ── Paleta temática ──────────────────────────────────────────────────────────
const C = {
	navy: "#1e3a8a",
	dark: "#2b2b2b",
	red: "#b91c1c",
	muted: "#6b7280",
	cream: "#f4ece1",
	roles: ["#1e3a8a", "#374151", "#b91c1c", "#92400e", "#064e3b", "#4c1d95"],
};

// ── Tipografía base para todos los gráficos ───────────────────────────────────
const FONT = "'Courier New', Courier, monospace";
const FONT_SM = 11;
const FONT_XS = 10;
const FONT_LG = 13;
const FONT_TT = 13;

// ── Traducción de roles ───────────────────────────────────────────────────────
const ROLE_MAP: Record<string, string> = {
	intern: "BECARIA",
	boss: "JEFE",
	secretary: "SECRETARIO",
	union: "SINDICATO",
};
const tr = (role: string) => ROLE_MAP[role.toLowerCase()] ?? role.toUpperCase();

// ── Etiquetas del radar ───────────────────────────────────────────────────────
const RADAR_LABELS = [
	"DAÑO\nINFLIGIDO",
	"PASIVAS\nEQUIPADAS",
	"CARTAS\nROBADAS",
	"CURACIÓN\nREALIZADA",
	"ATAQUES\nESQUIVADOS",
];

const ECHARTS_BASE: Partial<EChartsOption> = {
	backgroundColor: "transparent",
	textStyle: { fontFamily: FONT, color: C.dark, fontSize: FONT_SM },
};

const TOOLTIP_CSS = `
	font-family: Courier New, Courier, monospace;
	font-size: ${FONT_TT}px;
	font-weight: 700;
	color: #2b2b2b;
	box-shadow: 0 4px 16px rgba(0,0,0,0.18);
	border: 1.5px solid #2b2b2b !important;
	border-radius: 0 !important;
	padding: 10px 14px !important;
	line-height: 1.7;
`;

const TOOLTIP_BASE = {
	confine: false,
	appendToBody: true,
	textStyle: { fontFamily: FONT, fontSize: FONT_TT, color: C.dark },
	extraCssText: TOOLTIP_CSS,
};

/* ── Helpers para descripciones accesibles de cada gráfico ───────────────── */

function radarDescription(
	stats: ReturnType<typeof useProfileStats>["basicStats"],
) {
	return [
		`Daño infligido: ${stats.damage}`,
		`Pasivas equipadas: ${stats.passives}`,
		`Cartas robadas: ${stats.cardsStolen}`,
		`Curación realizada: ${stats.healing}`,
		`Ataques esquivados: ${stats.dodgedAttacks}`,
	].join(". ");
}

function doughnutDescription(
	data: { role: string; count: number }[],
	total: number,
) {
	if (data.length === 0) return "Sin datos de roles jugados.";
	return (
		"Distribución de roles: " +
		data
			.map((d) => {
				const pct = total > 0 ? ((d.count / total) * 100).toFixed(0) : 0;
				return `${tr(d.role)}: ${d.count} partidas (${pct}%)`;
			})
			.join("; ")
	);
}

function winrateDescription(
	data: { role: string; winrate: number; total: number }[],
) {
	if (data.length === 0) return "Sin datos de eficacia por rol.";
	return (
		"Eficacia por rol: " +
		data
			.map((d) => `${tr(d.role)}: ${d.winrate}% en ${d.total} partidas`)
			.join("; ")
	);
}

function topCardsDescription(
	cards: { id: number; name: string; count: number }[],
) {
	if (cards.length === 0) return "Sin datos de cartas más usadas.";
	return (
		"Cartas más usadas: " +
		cards.map((c) => `${c.name}: ${c.count} usos`).join("; ")
	);
}

function aliveDeadDescription(alive: number, dead: number, total: number) {
	if (total === 0) return "Sin datos de supervivencia.";
	const alivePct = ((alive / total) * 100).toFixed(0);
	const deadPct = ((dead / total) * 100).toFixed(0);
	return `Tasa de supervivencia: ${alive} victorias (${alivePct}%), ${dead} derrotas (${deadPct}%).`;
}

/* ── Componente principal ─────────────────────────────────────────────────── */

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

	// ── Opciones ECharts (sin cambios) ────────────────────────────────────

	const radarOption: EChartsOption = {
		...ECHARTS_BASE,
		tooltip: {
			...TOOLTIP_BASE,
			trigger: "item",
			formatter: () => {
				const rows: [string, number][] = [
					["DAÑO INFLIGIDO", basicStats.damage],
					["PASIVAS EQUIPADAS", basicStats.passives],
					["CARTAS ROBADAS", basicStats.cardsStolen],
					["CURACIÓN REALIZADA", basicStats.healing],
					["ATAQUES ESQUIVADOS", basicStats.dodgedAttacks],
				];
				return rows
					.map(([label, val]) => `${label}: <b>${val}</b>`)
					.join("<br/>");
			},
		},
		radar: {
			indicator: RADAR_LABELS.map((name) => ({ name, max: 100 })),
			shape: "polygon",
			splitNumber: 4,
			radius: "60%",
			axisName: {
				color: C.dark,
				fontSize: FONT_SM,
				fontWeight: 900,
				fontFamily: FONT,
			},
			splitLine: { lineStyle: { color: "rgba(43,43,43,0.15)" } },
			splitArea: {
				show: true,
				areaStyle: {
					color: ["rgba(255,255,255,0.05)", "rgba(43,43,43,0.04)"],
				},
			},
			axisLine: { lineStyle: { color: "rgba(43,43,43,0.2)" } },
		},
		series: [
			{
				type: "radar",
				data: [
					{
						value: radarData,
						name: user ?? "",
						areaStyle: { color: "rgba(30,58,138,0.18)" },
						lineStyle: { color: C.navy, width: 2 },
						itemStyle: { color: C.navy },
						symbol: "circle",
						symbolSize: 6,
						label: { show: false },
					},
				],
			},
		],
	};

	const doughnutOption: EChartsOption = {
		...ECHARTS_BASE,
		tooltip: {
			...TOOLTIP_BASE,
			trigger: "item",
			formatter: (params: any) =>
				`${params.name}<br/>${params.value} partidas · <b>${params.percent}%</b>`,
		},
		legend: {
			orient: "vertical",
			right: "2%",
			top: "center",
			itemWidth: 10,
			itemHeight: 10,
			textStyle: {
				fontSize: FONT_SM,
				fontFamily: FONT,
				color: C.dark,
				fontWeight: 700,
			},
		},
		series: [
			{
				type: "pie",
				radius: ["40%", "65%"],
				center: ["36%", "50%"],
				label: {
					show: true,
					formatter: "{d}%",
					fontSize: FONT_SM,
					fontFamily: FONT,
					fontWeight: 900,
					color: C.dark,
				},
				labelLine: { length: 10, length2: 8 },
				emphasis: {
					label: { fontSize: FONT_LG },
				},
				data: roleDistribution.map(({ role, count }, i) => ({
					name: tr(role),
					value: count,
					itemStyle: { color: C.roles[i % C.roles.length] },
				})),
			},
		],
	};

	const winrateOption: EChartsOption = {
		...ECHARTS_BASE,
		tooltip: {
			...TOOLTIP_BASE,
			trigger: "axis",
			axisPointer: { type: "shadow" },
			formatter: (params: any) => {
				const p = params[0];
				return `${p.name}<br/>Winrate: <b>${p.value}%</b>`;
			},
		},
		grid: { top: 8, bottom: 36, left: 110, right: 70 },
		xAxis: {
			type: "value",
			max: 100,
			axisLabel: {
				formatter: "{value}%",
				fontSize: FONT_XS,
				fontFamily: FONT,
				color: C.muted,
			},
			splitLine: { lineStyle: { color: "rgba(43,43,43,0.1)" } },
		},
		yAxis: {
			type: "category",
			data: winrateByRole.map((r) => tr(r.role)),
			axisLabel: {
				fontSize: FONT_SM,
				fontWeight: 900,
				fontFamily: FONT,
				color: C.dark,
				width: 100,
				overflow: "truncate",
			},
			axisTick: { show: false },
			axisLine: { show: false },
		},
		series: [
			{
				type: "bar",
				barMaxWidth: 22,
				data: winrateByRole.map((r, i) => ({
					value: r.winrate,
					label: {
						show: true,
						position: "right",
						formatter: `${r.winrate}% · ${r.total}p`,
						fontSize: FONT_XS,
						fontFamily: FONT,
						fontWeight: 700,
						color: C.muted,
					},
					itemStyle: { color: C.roles[i % C.roles.length] },
				})),
			},
		],
	};

	const topCardsOption: EChartsOption = {
		...ECHARTS_BASE,
		tooltip: {
			...TOOLTIP_BASE,
			trigger: "axis",
			axisPointer: { type: "shadow" },
			formatter: (params: any) => {
				const p = params[0];
				return `${p.name}<br/>Usada: <b>${p.value} veces</b>`;
			},
		},
		grid: { top: 8, bottom: 36, left: 150, right: 56 },
		xAxis: {
			type: "value",
			minInterval: 1,
			axisLabel: {
				fontSize: FONT_XS,
				fontFamily: FONT,
				color: C.muted,
			},
			splitLine: { lineStyle: { color: "rgba(43,43,43,0.1)" } },
		},
		yAxis: {
			type: "category",
			data: [...topCards].reverse().map((c) => c.name),
			axisLabel: {
				fontSize: FONT_SM,
				fontWeight: 900,
				fontFamily: FONT,
				color: C.dark,
				width: 140,
				overflow: "truncate",
			},
			axisTick: { show: false },
			axisLine: { show: false },
		},
		series: [
			{
				type: "bar",
				barMaxWidth: 22,
				data: [...topCards].reverse().map((c) => ({
					value: c.count,
					label: {
						show: true,
						position: "right",
						formatter: `{c}x`,
						fontSize: FONT_LG,
						fontWeight: 900,
						fontFamily: FONT,
						color: C.dark,
					},
					itemStyle: { color: C.navy },
				})),
			},
		],
	};

	const aliveDeadOption: EChartsOption = {
		...ECHARTS_BASE,
		tooltip: {
			...TOOLTIP_BASE,
			trigger: "item",
			formatter: (params: any) =>
				`${params.name}<br/>${params.value} partidas · <b>${params.percent}%</b>`,
		},
		legend: {
			top: "8%",
			left: "center",
			itemWidth: 10,
			itemHeight: 10,
			textStyle: {
				fontSize: FONT_SM,
				fontFamily: FONT,
				color: C.dark,
				fontWeight: 700,
			},
		},
		series: [
			{
				type: "pie",
				radius: ["45%", "70%"],
				center: ["50%", "80%"],
				startAngle: 180,
				endAngle: 360,
				label: {
					show: true,
					formatter: "{b}\n{d}%",
					fontSize: FONT_SM,
					fontFamily: FONT,
					fontWeight: 900,
					color: C.dark,
				},
				labelLine: { length: 10, length2: 8 },
				emphasis: { label: { fontSize: FONT_LG } },
				data: [
					{
						name: "VICTORIA",
						value: aliveDeadData.alive,
						itemStyle: { color: C.navy },
					},
					{
						name: "DERROTA",
						value: aliveDeadData.dead,
						itemStyle: { color: C.red },
					},
				],
			},
		],
	};

	// ── Render principal ────────────────────────────────────────────────────
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
						<dt className={styles.statLabel}>DERROTAS REGISTRADAS:</dt>
						<dd className={styles.statValue}>{totalGames - basicStats.wins}</dd>
					</div>
					<div className={styles.statRow}>
						<dt className={styles.statLabel}>JUGADORES ELIMINADOS:</dt>
						<dd className={styles.statValue}>{basicStats.eliminations}</dd>
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
						<dt className={styles.statLabel}>PRODUCTIVIDAD (CARTAS):</dt>
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

				{/* ── Contenedor expandible con rol region y aria-hidden ── */}
				<div
					id="advanced-stats"
					className={`${styles.expandableWrapper} ${isExpanded ? styles.open : ""}`}
					role="region"
					aria-label="Estadísticas avanzadas"
					aria-hidden={!isExpanded}
				>
					<div className={styles.expandedContentInner}>
						{isExpanded && (
							<div className={styles.chartsContainer}>
								{totalGames === 0 ? (
									<div
										className={styles.noData}
										role="status"
										aria-live="polite"
									>
										<span className={styles.noDataStamp}>SIN DATOS</span>
										<p className={styles.noDataText}>
											HISTORIAL VACÍO. NO SE HAN REGISTRADO PARTIDAS PARA
											GENERAR UN ANÁLISIS.
										</p>
										<p className={styles.noDataSub}>
											[ JUEGA AL MENOS UNA PARTIDA PARA PODER VISUALIZAR
											GRÁFICOS ]
										</p>
									</div>
								) : (
									<>
										{/* Fila 1: Radar + Doughnut */}
										<div className={styles.chartsRow}>
											<div className={styles.chartBlock}>
												<p className={styles.chartTitle}>
													— PERFIL DE JUGADOR —
												</p>
												{/* Descripción accesible */}
												<div className="sr-only">
													{radarDescription(basicStats)}
												</div>
												<div aria-hidden="true">
													<ReactECharts
														option={radarOption}
														style={{ height: 260 }}
														opts={{ renderer: "svg" }}
													/>
												</div>
											</div>

											<div className={styles.chartBlock}>
												<p className={styles.chartTitle}>— ROLES JUGADOS —</p>
												<div className="sr-only">
													{doughnutDescription(roleDistribution, totalGames)}
												</div>
												<div aria-hidden="true">
													<ReactECharts
														option={doughnutOption}
														style={{ height: 260 }}
														opts={{ renderer: "svg" }}
													/>
												</div>
											</div>
										</div>

										{/* Fila 2: Winrate por rol + Vivo/Muerto */}
										<div className={styles.chartsRow}>
											<div className={styles.chartBlock}>
												<p className={styles.chartTitle}>
													— EFICACIA POR ROL —
												</p>
												<div className="sr-only">
													{winrateDescription(winrateByRole)}
												</div>
												<div aria-hidden="true">
													<ReactECharts
														option={winrateOption}
														style={{
															height: Math.max(
																180,
																winrateByRole.length * 38 + 60,
															),
														}}
														opts={{ renderer: "svg" }}
													/>
												</div>
											</div>

											<div className={styles.chartBlock}>
												<p className={styles.chartTitle}>
													— TASA DE SUPERVIVENCIA —
												</p>
												<div className="sr-only">
													{aliveDeadDescription(
														aliveDeadData.alive,
														aliveDeadData.dead,
														totalGames,
													)}
												</div>
												<div aria-hidden="true">
													<ReactECharts
														option={aliveDeadOption}
														style={{ height: 220 }}
														opts={{ renderer: "svg" }}
													/>
												</div>
											</div>
										</div>

										{/* Fila 3: Top 5 cartas */}
										{topCards.length > 0 && (
											<div
												className={`${styles.chartBlock} ${styles.chartFull}`}
											>
												<p className={styles.chartTitle}>
													— CARTAS MÁS USADAS —
												</p>
												<div className="sr-only">
													{topCardsDescription(topCards)}
												</div>
												<div aria-hidden="true">
													<ReactECharts
														option={topCardsOption}
														style={{
															height: Math.max(200, topCards.length * 42 + 60),
														}}
														opts={{ renderer: "svg" }}
													/>
												</div>
											</div>
										)}
									</>
								)}
							</div>
						)}
					</div>
				</div>

				{/* Anuncio de cambio de estado cuando se expande/colapsa */}
				<div className="sr-only" aria-live="polite" aria-atomic="true">
					{isExpanded
						? "Sección de estadísticas avanzadas abierta."
						: "Sección de estadísticas avanzadas cerrada."}
				</div>
			</div>
		</section>
	);
}
