// src/components/profile/graphs/WinrateChart.tsx
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import styles from "../GraphsProfile.module.css";

const FONT = "'Courier New', Courier, monospace";
const FONT_SM = 11;
const FONT_XS = 10;
const FONT_TT = 13;
const C = {
	dark: "#2b2b2b",
	muted: "#6b7280",
	roles: ["#1e3a8a", "#374151", "#b91c1c", "#92400e", "#064e3b", "#4c1d95"],
};

const ROLE_MAP: Record<string, string> = {
	intern: "BECARIA",
	boss: "JEFE",
	secretary: "SECRETARIO",
	union: "SINDICATO",
};
const tr = (role: string) => ROLE_MAP[role.toLowerCase()] ?? role.toUpperCase();

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

interface WinrateChartProps {
	winrateByRole: { role: string; winrate: number; total: number }[];
}

function winrateDescription(data: WinrateChartProps["winrateByRole"]) {
	if (data.length === 0) return "Sin datos de eficacia por rol.";
	return (
		"Eficacia por rol: " +
		data
			.map((d) => `${tr(d.role)}: ${d.winrate}% en ${d.total} partidas`)
			.join("; ")
	);
}

export default function WinrateChart({ winrateByRole }: WinrateChartProps) {
	const option: EChartsOption = {
		backgroundColor: "transparent",
		textStyle: { fontFamily: FONT, color: C.dark, fontSize: FONT_SM },
		tooltip: {
			trigger: "axis",
			axisPointer: { type: "shadow" },
			formatter: (params: any) => {
				const p = params[0];
				return `${p.name}<br/>Winrate: <b>${p.value}%</b>`;
			},
			confine: false,
			appendToBody: true,
			textStyle: { fontFamily: FONT, fontSize: FONT_TT, color: C.dark },
			extraCssText: TOOLTIP_CSS,
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

	return (
		<div className={styles.chartBlock}>
			<p className={styles.chartTitle}>— EFICACIA POR ROL —</p>
			<div className="sr-only">{winrateDescription(winrateByRole)}</div>
			<div aria-hidden="true">
				<ReactECharts
					option={option}
					style={{ height: Math.max(180, winrateByRole.length * 38 + 60) }}
					opts={{ renderer: "svg" }}
				/>
			</div>
		</div>
	);
}
