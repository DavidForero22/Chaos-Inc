import { useState, useEffect } from "react";
import { useGamesData } from "../../hooks/admin/useGamesData.ts";
import Pagination from "./Pagination.tsx";
import { FaSync } from "react-icons/fa";

// Constantes
const PAGE_SIZE = 20;

const roleTranslations: Record<string, string> = {
	boss: "Jefe",
	intern: "Becaria",
	union: "Sindicato",
	secretary: "Secretario",
	canceled: "Cancelada",
};

type SortField = "createdAt" | "winnerRole";
type SortDir = "asc" | "desc";
type WinnerFilter = "all" | string;

// Mini-componente para la flecha de ordenación
const SortArrow = ({ active, dir }: { active: boolean; dir: SortDir }) => {
	if (!active) return <span className="ml-1 opacity-30">▼</span>;
	return <span className="ml-1">{dir === "desc" ? "▼" : "▲"}</span>;
};

export default function GamesTab() {
	const { games, loading, fetchGames, totalPages, totalCount } = useGamesData();

	// Filtros
	const [winnerFilter, setWinnerFilter] = useState<WinnerFilter>("all");
	const [playerCount, setPlayerCount] = useState<number | "all">("all");

	// Ordenación
	const [sortField, setSortField] = useState<SortField>("createdAt");
	const [sortDir, setSortDir] = useState<SortDir>("desc");

	// Paginación y UI
	const [page, setPage] = useState(1);
	const [isRefreshing, setIsRefreshing] = useState(false);

	// Efecto principal: Se ejecuta al cambiar cualquier parámetro
	useEffect(() => {
		fetchGames(page, winnerFilter, playerCount, sortField, sortDir);
	}, [fetchGames, page, winnerFilter, playerCount, sortField, sortDir]);

	// Handlers
	const resetPage = () => setPage(1);

	const handleSort = (field: SortField) => {
		if (sortField === field) {
			setSortDir(sortDir === "asc" ? "desc" : "asc");
		} else {
			setSortField(field);
			setSortDir("desc");
		}
		resetPage();
	};

	const handleRefresh = async () => {
		setIsRefreshing(true);
		try {
			// Pasar `true` al final para forzar el refresh ignorando la caché
			await fetchGames(
				page,
				winnerFilter,
				playerCount,
				sortField,
				sortDir,
				true,
			);
		} finally {
			setTimeout(() => setIsRefreshing(false), 800);
		}
	};

	const goTo = (p: number) => {
		const safeP = Math.max(1, Math.min(p, totalPages > 0 ? totalPages : 1));
		setPage(safeP);
	};

	if (loading && games.length === 0) {
		return (
			<div
				className="pl-6 pb-10 flex justify-center items-center h-[60vh]"
				role="status"
				aria-live="polite"
			>
				<div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#295c60]"></div>
				<span className="ml-3 font-mono">Cargando partidas...</span>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			{/* Cabecera */}
			<div className="flex justify-between items-end mb-2">
				<h2 className="font-bold text-lg underline decoration-2 uppercase">
					Registros de Partidas Finalizadas
				</h2>

				<button
					onClick={handleRefresh}
					disabled={isRefreshing}
					className="flex items-center gap-2 px-3 py-1.5 text-sm font-bold uppercase text-gray-600 hover:text-[#295c60] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					<FaSync className={`${isRefreshing ? "animate-spin" : ""}`} />
					<span className="hidden sm:inline">Actualizar</span>
				</button>
			</div>

			{/* ── Barra de filtros ── */}
			<div className="flex flex-wrap gap-4 items-end border-y-2 border-dashed border-gray-400/50 py-3">
				{/* Filtro rol ganador */}
				<div className="w-40">
					<label
						htmlFor="filter-winner"
						className="block text-xs font-bold uppercase opacity-60 mb-1"
					>
						Rol ganador
					</label>
					<select
						id="filter-winner"
						className="w-full bg-transparent border-b-2 border-gray-400 px-2 py-1 outline-none cursor-pointer text-sm"
						value={winnerFilter}
						onChange={(e) => {
							setWinnerFilter(e.target.value);
							resetPage();
						}}
					>
						<option value="all">Todos</option>
						{Object.entries(roleTranslations).map(([key, label]) => (
							<option key={key} value={key}>
								{label}
							</option>
						))}
					</select>
				</div>

				{/* Filtro nº jugadores */}
				<div className="w-32">
					<label
						htmlFor="filter-players"
						className="block text-xs font-bold uppercase opacity-60 mb-1"
					>
						Nº jugadores
					</label>
					<select
						id="filter-players"
						className="w-full bg-transparent border-b-2 border-gray-400 px-2 py-1 outline-none cursor-pointer text-sm"
						value={playerCount}
						onChange={(e) => {
							setPlayerCount(
								e.target.value === "all" ? "all" : Number(e.target.value),
							);
							resetPage();
						}}
					>
						<option value="all">Todos</option>
						{[3, 4, 5, 6].map((n) => (
							<option key={n} value={n}>
								{n} jugadores
							</option>
						))}
					</select>
				</div>

				{/* Ordenación (Nueva) */}
				<div className="flex gap-2 items-end pb-1 ml-auto">
					<span className="text-xs font-bold uppercase opacity-60 pb-1.5">
						Ordenar por:
					</span>
					<button
						onClick={() => handleSort("createdAt")}
						className={`text-xs font-bold uppercase px-2 py-1 border cursor-pointer transition-colors ${
							sortField === "createdAt"
								? "border-[#295c60] text-[#295c60] bg-[#295c60]/10"
								: "border-gray-400 text-gray-500 hover:border-[#295c60] hover:text-[#295c60]"
						}`}
					>
						Fecha
						<SortArrow active={sortField === "createdAt"} dir={sortDir} />
					</button>
					<button
						onClick={() => handleSort("winnerRole")}
						className={`text-xs font-bold uppercase px-2 py-1 border cursor-pointer transition-colors ${
							sortField === "winnerRole"
								? "border-[#295c60] text-[#295c60] bg-[#295c60]/10"
								: "border-gray-400 text-gray-500 hover:border-[#295c60] hover:text-[#295c60]"
						}`}
					>
						Rol
						<SortArrow active={sortField === "winnerRole"} dir={sortDir} />
					</button>
				</div>
			</div>

			{/* ── Listado ── */}
			<div
				className={`flex flex-col transition-opacity duration-300 ${isRefreshing ? "opacity-50" : "opacity-100"}`}
			>
				{games.length === 0 ? (
					<p className="py-8 text-center text-sm opacity-50 italic uppercase tracking-widest">
						Sin resultados
					</p>
				) : (
					games.map((g) => (
						<div
							key={g.id}
							className="py-4 border-b border-dashed border-gray-400/50"
						>
							<div className="flex justify-between items-center mb-3">
								<p className="font-bold text-lg">
									#{g.id} <span className="mx-2 opacity-50">|</span>{" "}
									{g.winnerRole === "canceled" ? (
										<span className="uppercase text-red-600 font-bold">
											PARTIDA CANCELADA
										</span>
									) : (
										<span className="uppercase text-green-700">
											Victoria: {roleTranslations[g.winnerRole] || g.winnerRole}
										</span>
									)}
								</p>
								<p className="text-xs opacity-70 font-bold">
									{new Date(g.playedAt).toLocaleDateString("es-ES")} —{" "}
									{g.totalRounds} RONDAS
								</p>
							</div>
							<div className="flex flex-wrap gap-2 mt-2">
								{g.players?.map((p, i) => (
									<span
										key={i}
										className={`text-xs px-2 py-1 font-bold tracking-wide uppercase border-2 ${
											p.stats.hasWon
												? "border-green-600 text-green-700 bg-green-100/50"
												: "border-gray-400 text-gray-500"
										}`}
									>
										{p.displayName} {p.isGuest ? "(INVITADO)" : ""} :{" "}
										{roleTranslations[p.stats.role] || p.stats.role}
									</span>
								))}
							</div>
						</div>
					))
				)}
			</div>

			{/* ── Paginación ── */}
			{games.length > 0 && (
				<Pagination
					page={page}
					totalPages={totalPages}
					pageSize={PAGE_SIZE}
					filteredCount={totalCount}
					totalCount={totalCount}
					onGoTo={goTo}
				/>
			)}
		</div>
	);
}
