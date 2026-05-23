// src/components/admin/analytics/UserGrowthChart.tsx
import { useRef, useEffect } from "react";
import * as echarts from "echarts";
import type { GrowthPoint } from "../../../hooks/admin/useAnalyticsDashboard";

interface Props {
	data: GrowthPoint[];
}

export default function UserGrowthChart({ data }: Props) {
	const chartRef = useRef<HTMLDivElement>(null);
	const chartInstance = useRef<echarts.ECharts | null>(null);

	useEffect(() => {
		if (!chartRef.current) return;

		// Destruir instancia anterior si existe
		if (chartInstance.current) {
			chartInstance.current.dispose();
		}

		chartInstance.current = echarts.init(chartRef.current);

		// Formatear fechas según la densidad de datos
		const formatDate = (dateStr: string, total: number) => {
			const date = new Date(dateStr);
			// Si hay muchos puntos (>60), mostrar solo día/mes
			if (total > 60) {
				return `${date.getDate()}/${date.getMonth() + 1}`;
			}
			// Si hay menos, mostrar día-mes
			return dateStr.slice(5); // MM-DD
		};

		const dates = data.map((d) => formatDate(d.date, data.length));
		const registered = data.map((d) => d.registered);
		const guests = data.map((d) => d.guests);

		// Calcular el máximo para ajustar el eje Y
		const maxValue = Math.max(...registered, ...guests);

		const option: echarts.EChartsOption = {
			tooltip: {
				trigger: "axis",
				axisPointer: { type: "shadow" },
				formatter: (params: any) => {
					let res = `<strong>${params[0].axisValue}</strong><br/>`;
					params.forEach((p: any) => {
						res += `${p.marker} ${p.seriesName}: ${p.value.toLocaleString()} usuarios<br/>`;
					});
					return res;
				},
			},
			legend: {
				data: ["Registrados", "Invitados"],
				orient: "horizontal",
				left: "center",
				bottom: 0, // 🔥 Leyenda abajo, fuera del área del gráfico
				itemWidth: 25,
				itemHeight: 14,
				textStyle: { fontSize: 11 },
			},
			grid: {
				left: "10%",
				right: "8%",
				top: "12%", // 🔥 Espacio para el título
				bottom: "12%", // 🔥 Espacio para la leyenda
				containLabel: true,
			},
			xAxis: {
				type: "category",
				data: dates,
				axisLabel: {
					rotate: dates.length > 30 ? 45 : 0,
					fontSize: dates.length > 60 ? 8 : 10,
					interval: dates.length > 60 ? Math.floor(dates.length / 20) : 0,
					overflow: "break",
					hideOverlap: true,
				},
				axisLine: { lineStyle: { color: "#666" } },
			},
			yAxis: {
				type: "value",
				name: "Usuarios acumulados",
				nameLocation: "middle",
				nameGap: 40,
				axisLabel: {
					formatter: (value: number) => value.toLocaleString(),
				},
				min: 0,
				max: maxValue * 1.05,
				splitLine: { lineStyle: { type: "dashed", color: "#ccc" } },
			},
			series: [
				{
					name: "Registrados",
					type: "line",
					smooth: true,
					data: registered,
					areaStyle: {
						opacity: 0.3,
						color: "#2E7D32",
					},
					lineStyle: { color: "#2E7D32", width: 2 },
					symbol: "circle",
					symbolSize: 4,
					step: false,
					connectNulls: false,
				},
				{
					name: "Invitados",
					type: "line",
					smooth: true,
					data: guests,
					areaStyle: {
						opacity: 0.3,
						color: "#F9A825",
					},
					lineStyle: { color: "#F9A825", width: 2 },
					symbol: "circle",
					symbolSize: 4,
					step: false,
					connectNulls: false,
				},
			],
			title: {
				text: "Crecimiento de Usuarios (Acumulado)",
				left: "center",
				top: 0,
				textStyle: { fontSize: 14, fontWeight: "bold" },
			},
			backgroundColor: "transparent",
			// Añadir zoom para datos muy grandes
			dataZoom:
				data.length > 90
					? [
							{
								type: "slider",
								start: data.length > 90 ? data.length - 90 : 0,
								end: 100,
								bottom: 30, // 🔥 Por encima de la leyenda
							},
							{
								type: "inside",
								start: data.length > 90 ? data.length - 90 : 0,
								end: 100,
							},
						]
					: [],
		};

		chartInstance.current.setOption(option, true);

		const handler = () => {
			chartInstance.current?.resize();
		};

		window.addEventListener("resize", handler);
		return () => {
			window.removeEventListener("resize", handler);
			chartInstance.current?.dispose();
		};
	}, [data]);

	return (
		<div
			className="bg-white/10 rounded-lg p-4 shadow-sm w-full overflow-x-auto"
			role="figure"
			aria-label="Crecimiento de usuarios"
		>
			<div
				ref={chartRef}
				style={{
					height: "420px",
					width: "100%",
					minWidth: data.length > 60 ? "700px" : "100%",
				}}
			/>
		</div>
	);
}
