// src/components/admin/UsersTab.tsx

import { useState, useEffect } from "react";
import { useUsersData } from "../../hooks/admin/useUsersData.ts";
import Pagination from "./Pagination.tsx";
import { useAuthStore } from "../../store/auth/useAuthStore.ts";
import { Link } from "react-router-dom";

// ── Constantes
const PAGE_SIZE = 20;

type SortField = "username" | "joinedAt";
type SortDir = "asc" | "desc";
type RoleFilter = "all" | "user" | "admin" | "guest";

// Mapeo de roles a español
const roleLabels: Record<string, string> = {
	admin: "Administrador",
	user: "Usuario",
	guest: "Invitado",
};

// ── Icono flecha (inline, sin dependencias)
function SortArrow({ active, dir }: { active: boolean; dir: SortDir }) {
	return (
		<span
			className={`ml-1 inline-block transition-transform ${active ? "opacity-100" : "opacity-30"}`}
			style={{ transform: dir === "desc" && active ? "scaleY(-1)" : undefined }}
		>
			▲
		</span>
	);
}

// ── Componente ────────────────────────────────────────────────────────────────
export default function UsersTab() {
	// ── OBTENER EL ID DEL USUARIO ACTUAL ──
	const currentUserId = useAuthStore((s) => s.id);

	const {
		users,
		loading,
		fetchUsers,
		createUser,
		updateUser,
		deleteUser,
		totalPages,
		totalCount,
	} = useUsersData();

	// Edición
	const [editingId, setEditingId] = useState<number | null>(null);
	const [editData, setEditData] = useState({
		username: "",
		email: "",
		role: "user",
	});

	// Creación
	const [showCreate, setShowCreate] = useState(false);
	const [createData, setCreateData] = useState({
		username: "",
		email: "",
		password: "",
		role: "user",
	});

	// Filtros
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");

	// Ordenación y Paginación
	const [sortField, setSortField] = useState<SortField>("username");
	const [sortDir, setSortDir] = useState<SortDir>("asc");
	const [page, setPage] = useState(1);

	// ── LÓGICA DE DEBOUNCE ──
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(search);
			setPage(1); // Resetear página al buscar
		}, 1000);
		return () => clearTimeout(timer);
	}, [search]);

	// ── LÓGICA DE FETCHING ──
	useEffect(() => {
		fetchUsers(page, debouncedSearch, roleFilter, sortField, sortDir);
	}, [fetchUsers, page, debouncedSearch, roleFilter, sortField, sortDir]);

	// ── Handlers de Filtros ──
	const handleRole = (v: RoleFilter) => {
		setRoleFilter(v);
		setPage(1);
	};

	const handleSort = (field: SortField) => {
		if (sortField === field) {
			setSortDir((d) => (d === "asc" ? "desc" : "asc"));
		} else {
			setSortField(field);
			setSortDir("asc");
		}
		setPage(1);
	};

	const goTo = (p: number) => {
		const safeP = Math.max(1, Math.min(p, totalPages > 0 ? totalPages : 1));
		setPage(safeP);
	};

	// ── Handlers CRUD ────────────────────────────────────────────────────────
	const handleDelete = async (id: number) => {
		if (!confirm("¿Eliminar usuario?")) return;
		try {
			await deleteUser(id);
		} catch (e: any) {
			alert(e.response?.data?.message || "Error al eliminar.");
		}
	};

	const handleSave = async (id: number) => {
		try {
			await updateUser(id, editData);
			setEditingId(null);
		} catch (e: any) {
			alert(e.response?.data?.message || "Error al actualizar.");
		}
	};

	const handleCreate = async () => {
		try {
			await createUser(createData);
			setCreateData({ username: "", email: "", password: "", role: "user" });
			setShowCreate(false);
		} catch (e: any) {
			alert(e.response?.data?.message || "Error al crear empleado.");
		}
	};

	// Helper para determinar el rol real
	const getDisplayRole = (userRole: string, isGuest: boolean) => {
		if (isGuest) return "guest";
		return userRole;
	};

	if (loading)
		return (
			<div className="pl-6 pb-10 flex justify-center items-center h-[60vh]">
				<div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#295c60]"></div>
				<span className="ml-3 font-mono">Cargando usuarios...</span>
			</div>
		);

	return (
		<div className="flex flex-col gap-4">
			{/* Cabecera + botón alta */}
			<div className="flex justify-between items-end mb-2">
				<h3 className="font-bold text-lg underline decoration-2 uppercase">
					Registro de Empleados
				</h3>
				<button
					onClick={() => setShowCreate(!showCreate)}
					className="px-4 py-2 border-2 border-[#295c60] text-[#295c60] font-bold text-xs uppercase cursor-pointer hover:bg-[#295c60] hover:text-[#d2d4d1] transition-colors"
				>
					{showCreate ? "Cancelar" : "+ Registrar"}
				</button>
			</div>

			{/* Formulario de creación */}
			{showCreate && (
				<div className="bg-gray-400/10 border-2 border-dashed border-[#295c60]/50 p-4 flex flex-wrap gap-4 items-end mb-4">
					<div className="flex-1 min-w-37.5">
						<label className="block text-xs font-bold uppercase opacity-70 mb-1">
							Nombre
						</label>
						<input
							className="w-full bg-transparent border-b-2 border-gray-400 px-2 py-1 outline-none focus:border-[#295c60]"
							value={createData.username}
							onChange={(e) =>
								setCreateData({ ...createData, username: e.target.value })
							}
							placeholder="Identificador"
						/>
					</div>
					<div className="flex-1 min-w-37.5">
						<label className="block text-xs font-bold uppercase opacity-70 mb-1">
							Email
						</label>
						<input
							className="w-full bg-transparent border-b-2 border-gray-400 px-2 py-1 outline-none focus:border-[#295c60]"
							value={createData.email}
							onChange={(e) =>
								setCreateData({ ...createData, email: e.target.value })
							}
							placeholder="correo@empresa.com"
						/>
					</div>
					<div className="flex-1 min-w-37.5">
						<label className="block text-xs font-bold uppercase opacity-70 mb-1">
							Clave
						</label>
						<input
							type="password"
							className="w-full bg-transparent border-b-2 border-gray-400 px-2 py-1 outline-none focus:border-[#295c60]"
							value={createData.password}
							onChange={(e) =>
								setCreateData({ ...createData, password: e.target.value })
							}
							placeholder="••••••••"
						/>
					</div>
					<div className="w-24">
						<label className="block text-xs font-bold uppercase opacity-70 mb-1">
							Cargo
						</label>
						<select
							className="w-full bg-transparent border-b-2 border-gray-400 px-2 py-1 outline-none cursor-pointer"
							value={createData.role}
							onChange={(e) =>
								setCreateData({ ...createData, role: e.target.value })
							}
						>
							<option value="user">Usuario</option>
							<option value="admin">Admin</option>
						</select>
					</div>
					<button
						onClick={handleCreate}
						className="px-4 py-2 bg-[#295c60] text-[#d2d4d1] font-bold text-xs uppercase"
					>
						Procesar
					</button>
				</div>
			)}

			{/* ── Barra de filtros ── */}
			<div className="flex flex-wrap gap-3 items-end border-y-2 border-dashed border-gray-400/50 py-3">
				{/* Búsqueda */}
				<div className="flex-1 min-w-48">
					<label className="block text-xs font-bold uppercase opacity-60 mb-1">
						Buscar
					</label>
					<input
						className="w-full bg-transparent border-b-2 border-gray-400 px-2 py-1 outline-none focus:border-[#295c60] text-sm"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Nombre de empleado…"
					/>
				</div>

				{/* Filtro rol */}
				<div className="w-36">
					<label className="block text-xs font-bold uppercase opacity-60 mb-1">
						Cargo
					</label>
					<select
						className="w-full bg-transparent border-b-2 border-gray-400 px-2 py-1 outline-none cursor-pointer text-sm"
						value={roleFilter}
						onChange={(e) => handleRole(e.target.value as RoleFilter)}
					>
						<option value="all">Todos</option>
						<option value="user">Usuario</option>
						<option value="admin">Administrador</option>
						<option value="guest">Invitado</option>
					</select>
				</div>

				{/* Ordenación */}
				<div className="flex gap-2 items-end pb-1">
					<span className="text-xs font-bold uppercase opacity-60 pb-1.5">
						Ordenar:
					</span>
					<button
						onClick={() => handleSort("username")}
						className={`text-xs font-bold uppercase px-2 py-1 border cursor-pointer transition-colors ${
							sortField === "username"
								? "border-[#295c60] text-[#295c60] bg-[#295c60]/10"
								: "border-gray-400 text-gray-500 hover:border-[#295c60] hover:text-[#295c60]"
						}`}
					>
						Nombre
						<SortArrow active={sortField === "username"} dir={sortDir} />
					</button>
					<button
						onClick={() => handleSort("joinedAt")}
						className={`text-xs font-bold uppercase px-2 py-1 border cursor-pointer transition-colors ${
							sortField === "joinedAt"
								? "border-[#295c60] text-[#295c60] bg-[#295c60]/10"
								: "border-gray-400 text-gray-500 hover:border-[#295c60] hover:text-[#295c60]"
						}`}
					>
						Alta
						<SortArrow active={sortField === "joinedAt"} dir={sortDir} />
					</button>
				</div>
			</div>

			{/* ── Listado paginado ── */}
			<div className="flex flex-col">
				{users.length === 0 ? (
					<p className="py-8 text-center text-sm opacity-50 italic uppercase tracking-widest">
						Sin resultados
					</p>
				) : (
					users.map((u) => {
						// ── IDENTIFICACIÓN SEGURA POR ID ──
						const isMe = String(u.id) === String(currentUserId);
						const displayRole = getDisplayRole(u.role, u.isGuest);

						return (
							<div
								key={u.id}
								className="py-4 border-b border-dashed border-gray-400/50"
							>
								{editingId === u.id ? (
									<div className="flex flex-wrap gap-4 items-end bg-gray-400/10 p-3 -mx-3 rounded">
										<input
											className="flex-1 bg-transparent border-b-2 border-gray-400 px-2 py-1 outline-none focus:border-[#295c60]"
											value={editData.username}
											onChange={(e) =>
												setEditData({ ...editData, username: e.target.value })
											}
										/>
										<input
											className="flex-1 bg-transparent border-b-2 border-gray-400 px-2 py-1 outline-none focus:border-[#295c60]"
											value={editData.email}
											onChange={(e) =>
												setEditData({ ...editData, email: e.target.value })
											}
										/>
										<select
											className="w-32 bg-transparent border-b-2 border-gray-400 px-2 py-1 outline-none cursor-pointer"
											value={editData.role}
											onChange={(e) =>
												setEditData({ ...editData, role: e.target.value })
											}
										>
											<option value="user">Usuario</option>
											<option value="admin">Administrador</option>
										</select>
										<div className="flex gap-2">
											<button
												onClick={() => setEditingId(null)}
												className="px-3 py-1 border border-gray-500 text-gray-600 text-xs font-bold uppercase cursor-pointer"
											>
												Cancelar
											</button>{" "}
											<button
												onClick={() => handleSave(u.id)}
												className="px-3 py-1 bg-[#295c60] text-white text-xs font-bold uppercase cursor-pointer"
											>
												Guardar
											</button>
										</div>
									</div>
								) : (
									<div className="flex justify-between items-center">
										<div>
											<span className="font-bold text-lg">
												#{u.id} <span className="mx-2 opacity-50">|</span>{" "}
												<Link
													to={`/profile/${u.id}`}
													className="hover:underline hover:text-[#295c60] transition-colors"
												>
													{u.username}
												</Link>
												{isMe && (
													<span className="ml-2 text-xs text-[#295c60] italic">
														(TÚ)
													</span>
												)}
												<span
													className={`ml-3 text-xs px-2 py-0.5 border ${
														displayRole === "admin"
															? "border-red-700 text-red-700 bg-red-100/50"
															: displayRole === "guest"
																? "border-orange-600 text-orange-700 bg-orange-100/50"
																: "border-blue-700 text-blue-700 bg-blue-100/50"
													}`}
												>
													{roleLabels[displayRole]?.toUpperCase()}
												</span>
											</span>
											<p className="text-sm opacity-70 mt-1">
												<span className="font-bold">Email:</span>{" "}
												{u.email || "Oculto"} <span className="mx-2">|</span>{" "}
												<span className="font-bold">Alta:</span>{" "}
												{new Date(u.joinedAt).toLocaleDateString("es-ES")}
											</p>
										</div>
										<div className="flex gap-3 items-center">
											{isMe ? (
												<span className="text-xs font-bold text-gray-500 opacity-60 italic tracking-widest">
													[SESIÓN ACTIVA - INMODIFICABLE]
												</span>
											) : displayRole === "guest" ? (
												<button
													onClick={() => handleDelete(u.id)}
													className="text-sm font-bold text-red-700 hover:underline cursor-pointer"
												>
													ELIMINAR
												</button>
											) : (
												<>
													<button
														onClick={() => {
															setEditingId(u.id);
															// ── FIX TYPE ERROR: Fallback para el email a un string vacío
															setEditData({
																username: u.username,
																email: u.email || "",
																role: u.role,
															});
														}}
														className="text-sm font-bold text-blue-700 hover:underline cursor-pointer"
													>
														EDITAR
													</button>
													<button
														onClick={() => handleDelete(u.id)}
														className="text-sm font-bold text-red-700 hover:underline cursor-pointer"
													>
														ELIMINAR
													</button>
												</>
											)}
										</div>
									</div>
								)}
							</div>
						);
					})
				)}
			</div>

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
