// src/components/admin/analytics/AnalyticsDashboard.tsx
import { useAnalyticsDashboard } from "../../../hooks/admin/useAnalyticsDashboard";
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

	if (loading) {
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
			{/* Selector de rango de días */}
			<div className="flex justify-end items-center gap-2 mb-4">
				<label
					htmlFor="daysRange"
					className="text-sm font-bold uppercase opacity-70"
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

			{/* Grid: 2 columnas en desktop, 1 en móvil */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<WinRateChart data={data.win_rate} />
				<TopCardsChart data={data.top_cards} />
				<UserGrowthChart data={data.user_growth} />
				<SocialLoginChart data={data.social_auth} />
			</div>
		</div>
	);
}
