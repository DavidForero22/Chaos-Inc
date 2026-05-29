// src/components/profile/graphs/DoughnutChart.tsx
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import styles from "../GraphsProfile.module.css";

const FONT = "'Courier New', Courier, monospace";
const FONT_SM = 11;
const FONT_LG = 13;
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

interface DoughnutChartProps {
	roleDistribution: { role: string; count: number }[];
	totalGames: number;
}

function doughnutDescription(
	data: DoughnutChartProps["roleDistribution"],
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

export default function DoughnutChart({
	roleDistribution,
	totalGames,
}: DoughnutChartProps) {
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
			orient: "horizontal",
			bottom: "0%",
			left: "center",
			itemWidth: 12,
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
				radius: ["35%", "60%"],
				center: ["50%", "45%"],
				label: {
					show: true,
					formatter: "{d}%",
					fontSize: FONT_SM,
					fontFamily: FONT,
					fontWeight: 900,
					color: C.dark,
				},
				labelLine: {
					length: 8,
					length2: 6,
				},
				emphasis: { label: { fontSize: FONT_LG } },
				data: roleDistribution.map(({ role, count }, i) => ({
					name: tr(role),
					value: count,
					itemStyle: { color: C.roles[i % C.roles.length] },
				})),
			},
		],
	};

	return (
		<div className={styles.chartBlock}>
			<p className={styles.chartTitle}>— ROLES JUGADOS —</p>
			<div className="sr-only">
				{doughnutDescription(roleDistribution, totalGames)}
			</div>
			<div aria-hidden="true">
				<ReactECharts
					option={option}
					style={{ height: 300 }}
					opts={{ renderer: "svg" }}
				/>
			</div>
		</div>
	);
}
