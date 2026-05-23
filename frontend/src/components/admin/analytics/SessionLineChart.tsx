// src/components/admin/analytics/SessionLineChart.tsx
import { useRef, useEffect } from "react";
import * as echarts from "echarts";
import type { SessionHourlyData } from "../../../hooks/admin/useAnalyticsDashboard";

interface Props {
	data: SessionHourlyData[];
}

export default function SessionLineChart({ data }: Props) {
	const chartRef = useRef<HTMLDivElement>(null);
	const chartInstance = useRef<echarts.ECharts | null>(null);

	useEffect(() => {
		if (!chartRef.current) return;

		if (chartInstance.current) {
			chartInstance.current.dispose();
		}

		chartInstance.current = echarts.init(chartRef.current);

		const hours = data.map((d) => `${d.hour}:00`);
		const sessions = data.map((d) => d.sessions);

		const option: echarts.EChartsOption = {
			tooltip: {
				trigger: "axis",
				axisPointer: { type: "shadow" },
				formatter: (params: any) => {
					const p = params[0];
					return `<strong>${p.name}</strong><br/>Sesiones promedio: ${p.value}`;
				},
			},
			grid: {
				left: "8%",
				right: "5%",
				top: "12%",
				bottom: "8%",
				containLabel: true,
			},
			xAxis: {
				type: "category",
				data: hours,
				name: "Hora del día",
				nameLocation: "middle",
				nameGap: 35,
				axisLabel: {
					rotate: 45,
					interval: 3, // Mostrar cada 3 horas
					fontSize: 10,
				},
			},
			yAxis: {
				type: "value",
				name: "Sesiones (promedio)",
				nameLocation: "middle",
				nameGap: 45,
				min: 0,
				axisLabel: {
					fontSize: 10,
				},
				splitLine: {
					lineStyle: { type: "dashed", color: "#ccc" },
				},
			},
			series: [
				{
					name: "Sesiones activas",
					type: "line",
					smooth: true,
					data: sessions,
					lineStyle: {
						color: "#295c60",
						width: 2,
					},
					areaStyle: {
						opacity: 0.3,
						color: "#295c60",
					},
					symbol: "circle",
					symbolSize: 6,
					itemStyle: {
						color: "#295c60",
						borderColor: "#ffffff",
						borderWidth: 2,
					},
					markPoint: {
						data: [
							{ type: "max", name: "Pico máximo" },
							{ type: "min", name: "Valle mínimo" },
						],
						symbolSize: 30,
					},
				},
			],
			title: {
				text: "Actividad por Hora (Promedio diario)",
				left: "center",
				top: 0,
				textStyle: { fontSize: 14, fontWeight: "bold" },
			},
			backgroundColor: "transparent",
		};

		chartInstance.current.setOption(option, true);

		const handler = () => chartInstance.current?.resize();
		window.addEventListener("resize", handler);
		return () => {
			window.removeEventListener("resize", handler);
			chartInstance.current?.dispose();
		};
	}, [data]);

	return (
		<div
			className="bg-white/10 rounded-lg p-4 shadow-sm w-full"
			role="figure"
			aria-label="Gráfico de actividad por hora"
		>
			<div ref={chartRef} style={{ height: "400px", width: "100%" }} />
		</div>
	);
}
