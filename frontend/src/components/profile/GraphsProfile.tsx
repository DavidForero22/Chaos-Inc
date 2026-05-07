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

// ── Tipografía base para todos los gráficos ───────────────────────────────────
const FONT = "'Courier New', Courier, monospace";
const FONT_SM = 11; // etiquetas de ejes
const FONT_XS = 10; // secundarias / unidades
const FONT_LG = 13; // valores destacados sobre barras
const FONT_TT = 13; // tooltips — más grande para ser legibles

// ── Traducción de roles ───────────────────────────────────────────────────────
const ROLE_MAP: Record<string, string> = {
	intern: "BECARIO",
	boss: "JEFE",
	secretary: "SECRETARIO",
	union: "SINDICALISTA",
};
const tr = (role: string) => ROLE_MAP[role.toLowerCase()] ?? role.toUpperCase();

// ── Etiquetas del radar ───────────────────────────────────────────────────────
// El orden coincide con radarData del hook:
// [0] damageDealt · [1] damageReceived (inv.) · [2] cardsPlayed · [3] eliminations · [4] passivesPlayed
const RADAR_LABELS = [
	"DAÑO\nINFLIGIDO",
	"DAÑO\nRECIBIDO",
	"CURACIÓN\nREALIZADA",
	"JUGADORES\nELIMINADOS",
	"PASIVAS\nEQUIPADAS",
];

const ECHARTS_BASE: Partial<EChartsOption> = {
	backgroundColor: "transparent",
	textStyle: { fontFamily: FONT, color: C.dark, fontSize: FONT_SM },
};

// CSS seguro para tooltips (sin comillas internas que rompan el string)
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

// Configuración base de tooltip: monta en <body> para no quedar recortado
const TOOLTIP_BASE = {
	confine: false,
	appendToBody: true,
	textStyle: { fontFamily: FONT, fontSize: FONT_TT, color: C.dark },
	extraCssText: TOOLTIP_CSS,
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
		tooltip: {
			...TOOLTIP_BASE,
			// En series radar, trigger "item" recibe params como objeto único
			trigger: "item",
			formatter: () => {
				// Mostramos los totales reales de basicStats, no los valores normalizados
				const rows: [string, string | number][] = [
					["DAÑO INFLIGIDO", basicStats.damage],
					["DAÑO RECIBIDO", basicStats.received],
					["CURACIÓN REALIZADA", basicStats.healing],
					["JUGADORES ELIMINADOS", basicStats.eliminations],
					["PASIVAS EQUIPADAS", basicStats.passives],
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
						// Sin labels inline: los valores normalizados confundían al usuario
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
			data: [...topCards]
				.reverse()
				.map((c) => CARD_MAP[c.id] ?? `Carta #${c.id}`),
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

	// ── Render ───────────────────────────────────────────────────────────────
	return (
		<>
			<h1 className={viewStyles.sectionLabel}>ESTADÍSTICAS DEL JUGADOR</h1>
			<div className={viewStyles.section}>
				{/* ── KPIs ── */}
				<div className={styles.statsGrid}>
					<div className={styles.statRow}>
						<span className={styles.statLabel}>PARTIDAS JUGADAS:</span>
						<span className={styles.statValue}>{totalGames}</span>
					</div>
					<div className={styles.statRow}>
						<span className={styles.statLabel}>VICTORIAS REGISTRADAS:</span>
						<span
							className={`${styles.statValue} ${styles.statValueHighlight}`}
						>
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
									{/* Fila 1: Radar + Doughnut */}
									<div className={styles.chartsRow}>
										<div className={styles.chartBlock}>
											<p className={styles.chartTitle}>— PERFIL DE AGENTE —</p>
											<ReactECharts
												option={radarOption}
												style={{ height: 260 }}
												opts={{ renderer: "svg" }}
											/>
										</div>
										<div className={styles.chartBlock}>
											<p className={styles.chartTitle}>
												— DEPARTAMENTO HABITUAL —
											</p>
											<ReactECharts
												option={doughnutOption}
												style={{ height: 260 }}
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
												style={{
													height: Math.max(180, winrateByRole.length * 38 + 60),
												}}
												opts={{ renderer: "svg" }}
											/>
										</div>
										<div className={styles.chartBlock}>
											<p className={styles.chartTitle}>
												— TASA DE SUPERVIVENCIA —
											</p>
											<ReactECharts
												option={aliveDeadOption}
												style={{ height: 220 }}
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
												style={{
													height: Math.max(200, topCards.length * 42 + 60),
												}}
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
		</>
	);
}
