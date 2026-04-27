// src/components/admin/GamesTab.tsx

import { useState, useEffect, useMemo } from "react";
import { useGamesData } from "../../hooks/admin/useGamesData.ts";
import Pagination from "./Pagination.tsx";

// Constantes
const PAGE_SIZE = 20;

const roleTranslations: Record<string, string> = {
	boss: "Jefe",
	intern: "Becario",
	union: "Sindicalista",
	secretary: "Secretario",
};

type SortDir = "asc" | "desc";
type WinnerFilter = "all" | string;

// Componente
export default function GamesTab() {
	const { games, loading, fetchGames } = useGamesData();

	useEffect(() => {
		fetchGames();
	}, [fetchGames]);

	// Filtros
	const [winnerFilter, setWinnerFilter] = useState<WinnerFilter>("all");
	const [playerCount, setPlayerCount] = useState<number | "all">("all");
	const [sortDir, setSortDir] = useState<SortDir>("desc");

	// Paginación
	const [page, setPage] = useState(1);

	const resetPage = () => setPage(1);

	// Lógica filtrado + ordenación
	const filtered = useMemo(() => {
		let result = [...games];

		if (winnerFilter !== "all") {
			result = result.filter((g) => g.winnerRole === winnerFilter);
		}

		if (playerCount !== "all") {
			result = result.filter((g) => (g.players?.length ?? 0) === playerCount);
		}

		result.sort((a, b) => {
			const diff =
				new Date(a.playedAt).getTime() - new Date(b.playedAt).getTime();
			return sortDir === "asc" ? diff : -diff;
		});

		return result;
	}, [games, winnerFilter, playerCount, sortDir]);

	// ── Paginación ───────────────────────────────────────────────────────────
	const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
	const safePage = Math.min(page, totalPages);
	const paginated = filtered.slice(
		(safePage - 1) * PAGE_SIZE,
		safePage * PAGE_SIZE,
	);

	const goTo = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)));

	// ── Render ───────────────────────────────────────────────────────────────
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
				{paginated.length === 0 ? (
					<p className="py-8 text-center text-sm opacity-50 italic uppercase tracking-widest">
						Sin resultados
					</p>
				) : (
					paginated.map((g) => (
						<div
							key={g.id}
							className="py-4 border-b border-dashed border-gray-400/50"
						>
							<div className="flex justify-between items-center mb-3">
								<p className="font-bold text-lg">
									#{g.id} <span className="mx-2 opacity-50">|</span>{" "}
									<span className="uppercase text-green-700">
										Victoria: {roleTranslations[g.winnerRole] || g.winnerRole}
									</span>
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
				page={safePage}
				totalPages={totalPages}
				pageSize={PAGE_SIZE}
				filteredCount={filtered.length}
				totalCount={games.length}
				onGoTo={goTo}
			/>
		</div>
	);
}
