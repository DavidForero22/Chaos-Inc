// src/components/admin/analytics/SocialLoginChart.tsx
import { useRef, useEffect, useState } from "react";
import * as echarts from "echarts";
import type { SocialAuthData } from "../../../hooks/admin/useAnalyticsDashboard";

interface Props {
	data: SocialAuthData;
}

const methodLabels = {
	google: "Google",
	discord: "Discord",
	email: "Email",
};

const methodLabelsFull = {
	google: "Google",
	discord: "Discord",
	email: "Email / Password",
};

const methodColors = {
	google: "#DB4437",
	discord: "#5865F2",
	email: "#2E7D32",
};

export default function SocialLoginChart({ data }: Props) {
	const chartRef = useRef<HTMLDivElement>(null);
	const chartInstance = useRef<echarts.ECharts | null>(null);
	const [containerWidth, setContainerWidth] = useState(0);

	// Detectar ancho del contenedor
	useEffect(() => {
		const observer = new ResizeObserver((entries) => {
			for (let entry of entries) {
				setContainerWidth(entry.contentRect.width);
			}
		});

		if (chartRef.current?.parentElement) {
			observer.observe(chartRef.current.parentElement);
		}

		return () => observer.disconnect();
	}, []);

	useEffect(() => {
		if (!chartRef.current) return;

		// Verificar si ya existe una instancia válida antes de crear otra
		if (chartInstance.current && !chartInstance.current.isDisposed()) {
			chartInstance.current.dispose();
		}

		chartInstance.current = echarts.init(chartRef.current);

		const categories = Object.keys(data) as (keyof SocialAuthData)[];
		const values = categories.map((c) => data[c]);
		const total = values.reduce((a, b) => a + b, 0);

		// Usar etiquetas cortas en móvil (ancho < 500px)
		const useShortLabels = containerWidth < 500;
		const labels = useShortLabels ? methodLabels : methodLabelsFull;

		const option: echarts.EChartsOption = {
			tooltip: {
				trigger: "item",
				formatter: (params: any) => {
					return `${params.name}: ${params.value} usuarios (${params.percent}%)`;
				},
			},
			legend: {
				orient: containerWidth < 600 ? "horizontal" : "vertical",
				left: containerWidth < 600 ? "center" : "left",
				top: containerWidth < 600 ? "bottom" : "middle",
				data: categories.map((c) => labels[c]),
				textStyle: { fontSize: 11 },
				itemWidth: 20,
				itemHeight: 12,
			},
			series: [
				{
					name: "Métodos de acceso",
					type: "pie",
					radius: containerWidth < 500 ? ["35%", "60%"] : ["40%", "70%"],
					center: containerWidth < 600 ? ["50%", "45%"] : ["50%", "50%"],
					avoidLabelOverlap: true,
					label: {
						show: true,
						position: "outside",
						formatter: (params: any) => {
							// En móvil, mostrar solo porcentaje
							if (containerWidth < 500) {
								return `${params.percent}%`;
							}
							// En desktop, mostrar nombre y porcentaje
							return `${labels[params.name as keyof typeof labels]}: ${params.percent}%`;
						},
						fontSize: containerWidth < 500 ? 10 : 11,
						lineHeight: 16,
					},
					labelLine: {
						length: containerWidth < 500 ? 8 : 10,
						length2: containerWidth < 500 ? 5 : 8,
						smooth: true,
					},
					emphasis: {
						scale: true,
						label: {
							show: true,
							fontWeight: "bold",
						},
					},
					data: categories.map((c, i) => ({
						name: labels[c],
						value: values[i],
						itemStyle: { color: methodColors[c] },
					})),
				},
			],
			title: {
				text: "Métodos de Acceso",
				left: "center",
				top: 0,
				textStyle: { fontSize: 14, fontWeight: "bold" },
			},
			backgroundColor: "transparent",
			graphic:
				containerWidth < 500 && total > 0
					? [
							{
								type: "text",
								left: "center",
								top: "middle",
								style: {
									text: `${total}`,
									fill: "#333",
									fontSize: 24,
									fontWeight: "bold",
								},
								z: 100,
							},
							{
								type: "text",
								left: "center",
								top: "65%",
								style: {
									text: "total usuarios",
									fill: "#666",
									fontSize: 10,
								},
								z: 100,
							},
						]
					: undefined,
		};

		chartInstance.current.setOption(option, true);

		const handler = () => {
			if (chartInstance.current && !chartInstance.current.isDisposed()) {
				chartInstance.current.resize();
			}
		};

		window.addEventListener("resize", handler);

		return () => {
			window.removeEventListener("resize", handler);
			if (chartInstance.current && !chartInstance.current.isDisposed()) {
				chartInstance.current.dispose();
				chartInstance.current = null;
			}
		};
	}, [data, containerWidth]);

	return (
		<div
			className="bg-white/10 rounded-lg p-4 shadow-sm w-full"
			role="figure"
			aria-label="Métodos de acceso"
		>
			<div ref={chartRef} style={{ height: "380px", width: "100%" }} />
		</div>
	);
}
