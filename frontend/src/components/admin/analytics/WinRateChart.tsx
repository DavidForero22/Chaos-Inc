// src/components/admin/analytics/WinRateChart.tsx
import { useRef, useEffect } from "react";
import * as echarts from "echarts";
import type { WinRateData } from "../../../hooks/admin/useAnalyticsDashboard";

interface Props {
	data: WinRateData;
}

const roleLabels: Record<keyof WinRateData, string> = {
	boss: "Jefe",
	secretary: "Secretario",
	intern: "Becaria",
	union: "Sindicato",
	canceled: "Cancelada",
};

const roleColors: Record<keyof WinRateData, string> = {
	boss: "#D32F2F",
	secretary: "#F9A825",
	intern: "#2E7D32",
	union: "#1976D2",
	canceled: "#9E9E9E",
};

export default function WinRateChart({ data }: Props) {
	const chartRef = useRef<HTMLDivElement>(null);
	const chartInstance = useRef<echarts.ECharts | null>(null);

	useEffect(() => {
		if (!chartRef.current) return;
		if (!chartInstance.current) {
			chartInstance.current = echarts.init(chartRef.current);
		}

		const categories = Object.keys(data) as (keyof WinRateData)[];
		const values = categories.map((c) => data[c]);
		const colors = categories.map((c) => roleColors[c]);

		const option: echarts.EChartsOption = {
			tooltip: {
				trigger: "axis",
				axisPointer: { type: "shadow" },
				formatter: (params: any) => {
					const p = params[0];
					return `${p.name}: ${p.value}%`;
				},
			},
			grid: {
				left: "3%",
				right: "4%",
				bottom: "3%",
				containLabel: true,
			},
			xAxis: {
				type: "category",
				data: categories.map((c) => roleLabels[c]),
				axisLabel: { rotate: 30, fontSize: 10 },
			},
			yAxis: {
				type: "value",
				name: "Porcentaje (%)",
				max: 100,
			},
			series: [
				{
					name: "Victorias",
					type: "bar",
					data: values,
					itemStyle: {
						borderRadius: [4, 4, 0, 0],
						color: (params: any) => colors[params.dataIndex],
					},
					label: {
						show: true,
						position: "top",
						formatter: "{c}%",
					},
				},
			],
			title: {
				text: "Tasa de Victorias por Rol",
				left: "center",
				textStyle: { fontSize: 14, fontWeight: "bold" },
			},
			backgroundColor: "transparent",
		};

		chartInstance.current.setOption(option, true);
		window.addEventListener("resize", () => chartInstance.current?.resize());
		return () => {
			window.removeEventListener("resize", () =>
				chartInstance.current?.resize(),
			);
		};
	}, [data]);

	return (
		<div
			className="bg-white/10 rounded-lg p-4 shadow-sm"
			role="figure"
			aria-label="Gráfico de tasa de victorias"
		>
			<div ref={chartRef} style={{ height: "350px", width: "100%" }} />
		</div>
	);
}
