// src/components/admin/analytics/TopCardsChart.tsx
import { useRef, useEffect } from "react";
import * as echarts from "echarts";
import type { TopCard } from "../../../hooks/admin/useAnalyticsDashboard";

interface Props {
	data: TopCard[];
}

export default function TopCardsChart({ data }: Props) {
	const chartRef = useRef<HTMLDivElement>(null);
	const chartInstance = useRef<echarts.ECharts | null>(null);

	useEffect(() => {
		if (!chartRef.current) return;
		if (!chartInstance.current) {
			chartInstance.current = echarts.init(chartRef.current);
		}

		const names = data.map((card) => card.name);
		const totals = data.map((card) => card.total);

		const option: echarts.EChartsOption = {
			tooltip: {
				trigger: "axis",
				axisPointer: { type: "shadow" },
				formatter: (params: any) => {
					const p = params[0];
					return `${p.name}: ${p.value} veces`;
				},
			},
			grid: {
				left: "15%",
				right: "5%",
				containLabel: true,
			},
			xAxis: {
				type: "value",
				name: "Veces usada",
			},
			yAxis: {
				type: "category",
				data: names,
				axisLabel: { fontSize: 10, overflow: "break" },
			},
			series: [
				{
					name: "Veces jugada",
					type: "bar",
					data: totals,
					itemStyle: {
						borderRadius: [0, 4, 4, 0],
						color: "#F9A825",
					},
					label: {
						show: true,
						position: "right",
						formatter: "{c}",
					},
				},
			],
			title: {
				text: "Top 10 Cartas Más Usadas",
				left: "center",
				textStyle: { fontSize: 14, fontWeight: "bold" },
			},
			backgroundColor: "transparent",
		};

		chartInstance.current.setOption(option, true);
		const handler = () => chartInstance.current?.resize();
		window.addEventListener("resize", handler);
		return () => window.removeEventListener("resize", handler);
	}, [data]);

	return (
		<div
			className="bg-white/10 rounded-lg p-4 shadow-sm"
			role="figure"
			aria-label="Top cartas más usadas"
		>
			<div ref={chartRef} style={{ height: "400px", width: "100%" }} />
		</div>
	);
}
