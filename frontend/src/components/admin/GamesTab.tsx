// src/components/admin/GamesTab.tsx

import { useState, useEffect } from "react";
import { useGamesData } from "../../hooks/admin/useGamesData.ts";
import Pagination from "./Pagination.tsx";

// Constantes
const PAGE_SIZE = 20;

const roleTranslations: Record<string, string> = {
	boss: "Jefe",
	intern: "Becaria",
	union: "Sindicato",
	secretary: "Secretario",
	canceled: "Cancelada",
};

type SortDir = "asc" | "desc";
type WinnerFilter = "all" | string;

// Componente
export default function GamesTab() {
	const { games, loading, fetchGames, totalPages, totalCount } = useGamesData();

	// Filtros
	const [winnerFilter, setWinnerFilter] = useState<WinnerFilter>("all");
	const [playerCount, setPlayerCount] = useState<number | "all">("all");
	const [sortDir, setSortDir] = useState<SortDir>("desc");

	// Paginación
	const [page, setPage] = useState(1);

	// Cada vez que cambie cualquier parámetro, pedir datos nuevos al backend
	useEffect(() => {
		fetchGames(page, winnerFilter, playerCount, sortDir);
	}, [fetchGames, page, winnerFilter, playerCount, sortDir]);

	// Handlers para resetear a la página 1 cuando se cambia un filtro
	const resetPage = () => setPage(1);

	const goTo = (p: number) => {
		const safeP = Math.max(1, Math.min(p, totalPages > 0 ? totalPages : 1));
		setPage(safeP);
	};

	if (loading)
		return (
			<div className="pl-6 pb-10 flex justify-center items-center h-[60vh]">
				<div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#295c60]"></div>
				<span className="ml-3 font-mono">Cargando partidas...</span>
			</div>
		);

	return (
		<div className="flex flex-col gap-4">
			{/* Cabecera */}
			<h3 className="font-bold text-lg underline decoration-2 uppercase mb-2">
				Registros de Partidas Finalizadas
			</h3>

			{/* ── Barra de filtros ── */}
			<div className="flex flex-wrap gap-3 items-end border-y-2 border-dashed border-gray-400/50 py-3">
				{/* Filtro rol ganador */}
				<div className="w-44">
					<label className="block text-xs font-bold uppercase opacity-60 mb-1">
						Rol ganador
					</label>
					<select
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
				<div className="w-36">
					<label className="block text-xs font-bold uppercase opacity-60 mb-1">
						Nº jugadores
					</label>
					<select
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

				{/* Ordenación por fecha */}
				<div className="flex gap-2 items-end pb-1">
					<span className="text-xs font-bold uppercase opacity-60 pb-1.5">
						Fecha:
					</span>
					{(["desc", "asc"] as SortDir[]).map((dir) => (
						<button
							key={dir}
							onClick={() => {
								setSortDir(dir);
								resetPage();
							}}
							className={`text-xs font-bold uppercase px-2 py-1 border transition-colors ${
								sortDir === dir
									? "border-[#295c60] text-[#295c60] bg-[#295c60]/10"
									: "border-gray-400 text-gray-500 hover:border-[#295c60] hover:text-[#295c60]"
							}`}
						>
							{dir === "desc" ? "Reciente ▼" : "Antigua ▲"}
						</button>
					))}
				</div>
			</div>

			{/* ── Listado ── */}
			<div className="flex flex-col">
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
											{g.winnerRole === "canceled"
												? "PARTIDA CANCELADA"
												: roleTranslations[g.winnerRole]}
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
			<Pagination
				page={page}
				totalPages={totalPages}
				pageSize={PAGE_SIZE}
				filteredCount={totalCount}
				totalCount={totalCount}
				onGoTo={goTo}
			/>
		</div>
	);
}
