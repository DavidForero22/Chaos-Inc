// src/components/admin/RoomsTab.tsx

import { useState, useEffect, useMemo } from "react";
import { useRoomsData } from "../../hooks/admin/useRoomsData.ts";
import Pagination from "./Pagination.tsx";

// Constantes
const PAGE_SIZE = 20;

type SortDir = "asc" | "desc";
type StatusFilter = "all" | "waiting" | "in_game";

// Componente
export default function RoomsTab() {
	const { rooms, loading, fetchRooms } = useRoomsData();

	useEffect(() => {
		fetchRooms();
	}, [fetchRooms]);

	// Filtros
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
	const [sortDir, setSortDir] = useState<SortDir>("asc");

	// Paginación
	const [page, setPage] = useState(1);

	const resetPage = () => setPage(1);

	// Lógica filtrado + ordenación
	const filtered = useMemo(() => {
		let result = [...rooms];

		if (search.trim()) {
			const q = search.trim().toLowerCase();
			result = result.filter((r) => r.name.toLowerCase().includes(q));
		}

		if (statusFilter !== "all") {
			result = result.filter((r) => r.status === statusFilter);
		}

		result.sort((a, b) => {
			const cmp = a.name.localeCompare(b.name);
			return sortDir === "asc" ? cmp : -cmp;
		});

		return result;
	}, [rooms, search, statusFilter, sortDir]);

	// Paginación
	const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
	const safePage = Math.min(page, totalPages);
	const paginated = filtered.slice(
		(safePage - 1) * PAGE_SIZE,
		safePage * PAGE_SIZE,
	);

	const goTo = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)));

	// Render
	if (loading)
			return (
			<div className="pl-6 pb-10 flex justify-center items-center h-[60vh]">
				<div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#295c60]"></div>
				<span className="ml-3 font-mono">Cargando salas...</span>
			</div>
		);

	return (
		<div className="flex flex-col gap-4">
			{/* Cabecera */}
			<h3 className="font-bold text-lg underline decoration-2 uppercase mb-2">
				Salas de Juego Activas
			</h3>

			{/* ── Barra de filtros ── */}
			<div className="flex flex-wrap gap-3 items-end border-y-2 border-dashed border-gray-400/50 py-3">
				{/* Búsqueda por nombre */}
				<div className="flex-1 min-w-48">
					<label className="block text-xs font-bold uppercase opacity-60 mb-1">
						Buscar
					</label>
					<input
						className="w-full bg-transparent border-b-2 border-gray-400 px-2 py-1 outline-none focus:border-[#295c60] text-sm"
						value={search}
						onChange={(e) => {
							setSearch(e.target.value);
							resetPage();
						}}
						placeholder="Nombre de sala…"
					/>
				</div>

				{/* Filtro estado */}
				<div className="w-36">
					<label className="block text-xs font-bold uppercase opacity-60 mb-1">
						Estado
					</label>
					<select
						className="w-full bg-transparent border-b-2 border-gray-400 px-2 py-1 outline-none cursor-pointer text-sm"
						value={statusFilter}
						onChange={(e) => {
							setStatusFilter(e.target.value as StatusFilter);
							resetPage();
						}}
					>
						<option value="all">Todos</option>
						<option value="waiting">Esperando</option>
						<option value="in_game">En curso</option>
					</select>
				</div>

				{/* Ordenación por nombre */}
				<div className="flex gap-2 items-end pb-1">
					<span className="text-xs font-bold uppercase opacity-60 pb-1.5">
						Ordenar:
					</span>
					<button
						onClick={() => {
							setSortDir("asc");
							resetPage();
						}}
						className={`text-xs font-bold uppercase px-2 py-1 border transition-colors ${
							sortDir === "asc"
								? "border-[#295c60] text-[#295c60] bg-[#295c60]/10"
								: "border-gray-400 text-gray-500 hover:border-[#295c60] hover:text-[#295c60]"
						}`}
					>
						Nombre ▲
					</button>
					<button
						onClick={() => {
							setSortDir("desc");
							resetPage();
						}}
						className={`text-xs font-bold uppercase px-2 py-1 border transition-colors ${
							sortDir === "desc"
								? "border-[#295c60] text-[#295c60] bg-[#295c60]/10"
								: "border-gray-400 text-gray-500 hover:border-[#295c60] hover:text-[#295c60]"
						}`}
					>
						Nombre ▼
					</button>
				</div>
			</div>

			{/* ── Listado ── */}
			<div className="flex flex-col">
				{paginated.length === 0 ? (
					<p className="py-8 text-center text-sm opacity-50 italic uppercase tracking-widest">
						Sin resultados
					</p>
				) : (
					paginated.map((r) => (
						<div
							key={r.room_id}
							className="py-4 border-b border-dashed border-gray-400/50"
						>
							<div className="flex justify-between items-start">
								<div>
									<p className="font-bold text-lg flex items-center gap-3">
										{r.name}
										<span
											className={`text-xs px-2 py-0.5 border ${
												r.status === "in_game"
													? "border-blue-700 text-blue-700 bg-blue-100/50"
													: "border-yellow-600 text-yellow-700 bg-yellow-100/50"
											}`}
										>
											{r.status === "in_game" ? "EN CURSO" : "ESPERANDO"}
										</span>
									</p>
									<p className="text-sm opacity-70 mt-1">
										<span className="font-bold">ID:</span> {r.room_id}{" "}
										<span className="mx-2">|</span>
										<span className="font-bold">Jefe:</span> {r.owner_name}{" "}
										<span className="mx-2">|</span>
										<span className="font-bold">Aforo:</span> {r.players.length}
										/{r.max_players}
									</p>
								</div>

								<div className="flex flex-wrap justify-end gap-2 max-w-50">
									{r.players.map((p) => (
										<span
											key={p}
											className="text-xs bg-gray-200 border border-gray-400 px-2 py-0.5 rounded-sm font-bold opacity-80"
										>
											{p}
										</span>
									))}
								</div>
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
				totalCount={rooms.length}
				onGoTo={goTo}
			/>
		</div>
	);
}
