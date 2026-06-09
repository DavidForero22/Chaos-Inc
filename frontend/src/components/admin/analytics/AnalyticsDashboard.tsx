// src/components/admin/analytics/AnalyticsDashboard.tsx
import { useState } from "react";
import { useAnalyticsDashboard } from "../../../hooks/admin/useAnalyticsDashboard";
import { FaSync } from "react-icons/fa";
import WinRateChart from "./WinRateChart";
import TopCardsChart from "./TopCardsChart";
import UserGrowthChart from "./UserGrowthChart";
import SocialLoginChart from "./SocialLoginChart";

export default function AnalyticsDashboard({
	initialDays = 30,
}: {
	initialDays?: number;
}) {
	const { data, loading, error, refresh, days, setDays } =
		useAnalyticsDashboard(initialDays);

	// Estado para controlar la animación del botón de refresco
	const [isRefreshing, setIsRefreshing] = useState(false);

	// Manejador del botón manual
	const handleRefresh = async () => {
		setIsRefreshing(true);
		try {
			await refresh();
		} finally {
			setTimeout(() => setIsRefreshing(false), 800);
		}
	};

	if (loading && !data) {
		return (
			<div className="flex justify-center items-center h-96" aria-live="polite">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#295c60]"></div>
				<span className="ml-3 font-mono">Cargando analíticas...</span>
			</div>
		);
	}

	if (error) {
		return (
			<div className="text-center py-12" role="alert">
				<p className="text-red-600 font-bold">Error: {error}</p>
				<button
					onClick={refresh}
					className="mt-4 px-4 py-2 border border-[#295c60] text-[#295c60] hover:bg-[#295c60] hover:text-white transition"
				>
					Reintentar
				</button>
			</div>
		);
	}

	if (!data) return null;

	return (
		<div className="space-y-6">
			{/* Controles superiores */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-2 gap-4">
				<h2 className="font-bold text-lg underline decoration-2 uppercase">
					Analíticas del servidor
				</h2>

				<div className="flex items-center gap-4">
					{/* Botón de Refrescar Manual */}
					<button
						onClick={handleRefresh}
						disabled={isRefreshing}
						className="flex items-center gap-2 px-3 py-1.5 text-sm font-bold uppercase text-gray-600 hover:text-[#295c60] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						aria-label="Actualizar analíticas"
						title="Forzar actualización de datos"
					>
						<FaSync className={`${isRefreshing ? "animate-spin" : ""}`} />
						<span className="hidden sm:inline">Actualizar</span>
					</button>

					{/* Selector de rango de días */}
					<div className="flex items-center gap-2">
						<label
							htmlFor="daysRange"
							className="text-sm font-bold uppercase opacity-70 pb-1"
						>
							Rango:
						</label>
						<select
							id="daysRange"
							value={days}
							onChange={(e) => setDays(Number(e.target.value))}
							className="bg-transparent border-b-2 border-gray-400 px-2 py-1 text-sm focus:outline-none focus:border-[#295c60] cursor-pointer"
						>
							<option value={7}>Últimos 7 días</option>
							<option value={30}>Últimos 30 días</option>
							<option value={60}>Últimos 60 días</option>
							<option value={0}>Todo el historial</option>
						</select>
					</div>
				</div>
			</div>

			{/* Grid: 2 columnas en desktop, 1 en móvil */}
			<div
				className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-opacity duration-300 ${isRefreshing ? "opacity-60" : "opacity-100"}`}
			>
				<WinRateChart data={data.win_rate} />
				<TopCardsChart data={data.top_cards} />
				<UserGrowthChart data={data.user_growth} />
				<SocialLoginChart data={data.social_auth} />
			</div>
		</div>
	);
}
