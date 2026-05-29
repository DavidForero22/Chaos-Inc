// src/components/profile/graphs/TopCardsChart.tsx
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import styles from "../GraphsProfile.module.css";

const FONT = "'Courier New', Courier, monospace";
const FONT_SM = 11;
const FONT_XS = 10;
const FONT_LG = 13;
const FONT_TT = 13;
const C = { navy: "#1e3a8a", dark: "#2b2b2b", muted: "#6b7280" };

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

interface TopCardsChartProps {
	topCards: { id: number; name: string; count: number }[];
}

function topCardsDescription(cards: TopCardsChartProps["topCards"]) {
	if (cards.length === 0) return "Sin datos de cartas más usadas.";
	return (
		"Cartas más usadas: " +
		cards.map((c) => `${c.name}: ${c.count} usos`).join("; ")
	);
}

export default function TopCardsChart({ topCards }: TopCardsChartProps) {
	const option: EChartsOption = {
		backgroundColor: "transparent",
		textStyle: { fontFamily: FONT, color: C.dark, fontSize: FONT_SM },
		tooltip: {
			trigger: "axis",
			axisPointer: { type: "shadow" },
			formatter: (params: any) => {
				const p = params[0];
				return `${p.name}<br/>Usada: <b>${p.value} veces</b>`;
			},
			confine: false,
			appendToBody: true,
			textStyle: { fontFamily: FONT, fontSize: FONT_TT, color: C.dark },
			extraCssText: TOOLTIP_CSS,
		},
		grid: { top: 8, bottom: 36, left: 150, right: 56 },
		xAxis: {
			type: "value",
			minInterval: 1,
			axisLabel: { fontSize: FONT_XS, fontFamily: FONT, color: C.muted },
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

	return (
		<>
			<p className={styles.chartTitle}>— CARTAS MÁS USADAS —</p>
			<div className="sr-only">{topCardsDescription(topCards)}</div>
			<div aria-hidden="true">
				<ReactECharts
					option={option}
					style={{ height: Math.max(200, topCards.length * 42 + 60) }}
					opts={{ renderer: "svg" }}
				/>
			</div>
		</>
	);
}
