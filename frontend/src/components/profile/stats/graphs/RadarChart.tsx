// src/components/profile/graphs/RadarChart.tsx
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import styles from "../GraphsProfile.module.css";

const FONT = "'Courier New', Courier, monospace";
const FONT_SM = 11;
const FONT_TT = 13;
const C = { navy: "#1e3a8a", dark: "#2b2b2b" };

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

const RADAR_LABELS = [
	"DAÑO\nINFLIGIDO",
	"PASIVAS\nEQUIPADAS",
	"CARTAS\nROBADAS",
	"CURACIÓN\nREALIZADA",
	"ATAQUES\nESQUIVADOS",
];

interface RadarChartProps {
	basicStats: {
		damage: number;
		passives: number;
		cardsStolen: number;
		healing: number;
		dodgedAttacks: number;
	};
	radarData: number[];
	userName?: string | null;
}

function radarDescription(basicStats: RadarChartProps["basicStats"]) {
	return [
		`Daño infligido: ${basicStats.damage}`,
		`Pasivas equipadas: ${basicStats.passives}`,
		`Cartas robadas: ${basicStats.cardsStolen}`,
		`Curación realizada: ${basicStats.healing}`,
		`Ataques esquivados: ${basicStats.dodgedAttacks}`,
	].join(". ");
}

export default function RadarChart({
	basicStats,
	radarData,
	userName,
}: RadarChartProps) {
	const option: EChartsOption = {
		backgroundColor: "transparent",
		textStyle: { fontFamily: FONT, color: C.dark, fontSize: FONT_SM },
		tooltip: {
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
			confine: false,
			appendToBody: true,
			textStyle: { fontFamily: FONT, fontSize: FONT_TT, color: C.dark },
			extraCssText: TOOLTIP_CSS,
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
				areaStyle: { color: ["rgba(255,255,255,0.05)", "rgba(43,43,43,0.04)"] },
			},
			axisLine: { lineStyle: { color: "rgba(43,43,43,0.2)" } },
		},
		series: [
			{
				type: "radar",
				data: [
					{
						value: radarData,
						name: userName ?? "",
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

	return (
		<div className={styles.chartBlock}>
			<p className={styles.chartTitle}>— PERFIL DE JUGADOR —</p>
			<div className="sr-only">{radarDescription(basicStats)}</div>
			<div aria-hidden="true">
				<ReactECharts
					option={option}
					style={{ height: 260 }}
					opts={{ renderer: "svg" }}
				/>
			</div>
		</div>
	);
}
