// src/components/profile/graphs/AliveDeadChart.tsx
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import styles from "../GraphsProfile.module.css";

const FONT = "'Courier New', Courier, monospace";
const FONT_SM = 11;
const FONT_LG = 13;
const FONT_TT = 13;
const C = { navy: "#1e3a8a", red: "#b91c1c", dark: "#2b2b2b" };

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

interface AliveDeadChartProps {
	aliveDeadData: { alive: number; dead: number };
	totalGames: number;
}

function aliveDeadDescription(alive: number, dead: number, total: number) {
	if (total === 0) return "Sin datos de supervivencia.";
	const alivePct = ((alive / total) * 100).toFixed(0);
	const deadPct = ((dead / total) * 100).toFixed(0);
	return `Tasa de supervivencia: ${alive} vivo (${alivePct}%), ${dead} muerto (${deadPct}%).`;
}

export default function AliveDeadChart({
	aliveDeadData,
	totalGames,
}: AliveDeadChartProps) {
	const option: EChartsOption = {
		backgroundColor: "transparent",
		textStyle: { fontFamily: FONT, color: C.dark, fontSize: FONT_SM },
		tooltip: {
			trigger: "item",
			formatter: (params: any) =>
				`${params.name}<br/>${params.value} partidas · <b>${params.percent}%</b>`,
			confine: false,
			appendToBody: true,
			textStyle: { fontFamily: FONT, fontSize: FONT_TT, color: C.dark },
			extraCssText: TOOLTIP_CSS,
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
						name: "VIVO",
						value: aliveDeadData.alive,
						itemStyle: { color: C.navy },
					},
					{
						name: "MUERTO",
						value: aliveDeadData.dead,
						itemStyle: { color: C.red },
					},
				],
			},
		],
	};

	return (
		<div className={styles.chartBlock}>
			<p className={styles.chartTitle}>— TASA DE SUPERVIVENCIA —</p>
			<div className="sr-only">
				{aliveDeadDescription(
					aliveDeadData.alive,
					aliveDeadData.dead,
					totalGames,
				)}
			</div>
			<div aria-hidden="true">
				<ReactECharts
					option={option}
					style={{ height: 220 }}
					opts={{ renderer: "svg" }}
				/>
			</div>
		</div>
	);
}
