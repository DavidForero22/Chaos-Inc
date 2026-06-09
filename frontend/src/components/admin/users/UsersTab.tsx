import { useState, useEffect } from "react";
import { useUsersData } from "../../../hooks/admin/useUsersData.ts";
import Pagination from "../Pagination.tsx";
import { useAuthStore } from "../../../store/auth/useAuthStore.ts";
import EditUserModal from "./EditUserModal.tsx";
import CreateUserModal from "./CreateUserModal.tsx";
import UserList from "./UserList.tsx";
import { FaSync } from "react-icons/fa";

// ── Constantes
const PAGE_SIZE = 20;

type SortField = "username" | "joinedAt";
type SortDir = "asc" | "desc";
type RoleFilter = "all" | "user" | "admin" | "guest";

// ── Icono flecha
function SortArrow({ active, dir }: { active: boolean; dir: SortDir }) {
	return (
		<span
			className={`ml-1 inline-block transition-transform ${
				active ? "opacity-100" : "opacity-30"
			}`}
			style={{
				transform: dir === "desc" && active ? "scaleY(-1)" : undefined,
			}}
		>
			▲
		</span>
	);
}

export default function UsersTab() {
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
		generateTempPassword,
	} = useUsersData();

	// Modales
	const [editingUser, setEditingUser] = useState<any | null>(null);
	const [showCreateModal, setShowCreateModal] = useState(false);

	// Estado del botón de refresco
	const [isRefreshing, setIsRefreshing] = useState(false);

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
			setPage(1);
		}, 1000);
		return () => clearTimeout(timer);
	}, [search]);

	// ── LÓGICA DE FETCHING ──
	useEffect(() => {
		fetchUsers(page, debouncedSearch, roleFilter, sortField, sortDir);
	}, [fetchUsers, page, debouncedSearch, roleFilter, sortField, sortDir]);

	// ── Handlers ──
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

	const handleRefresh = async () => {
		setIsRefreshing(true);
		try {
			await fetchUsers(
				page,
				debouncedSearch,
				roleFilter,
				sortField,
				sortDir,
				true,
			);
		} finally {
			setTimeout(() => setIsRefreshing(false), 800);
		}
	};

	// ── Handlers CRUD ──
	const handleDelete = async (id: number) => {
		if (!confirm("¿Eliminar usuario?")) return;
		try {
			await deleteUser(id);
		} catch (e: any) {
			alert(e.response?.data?.message || "Error al eliminar.");
		}
	};

	const handleSaveFromModal = async (id: number, data: any) => {
		await updateUser(id, data);
		setEditingUser(null);
	};

	const handleCreate = async (data: {
		username: string;
		email: string;
		password: string;
		role: string;
	}) => {
		await createUser(data);
		setShowCreateModal(false);
	};

	const getDisplayRole = (userRole: string, isGuest: boolean) => {
		if (isGuest) return "guest";
		return userRole;
	};

	if (loading && users.length === 0)
		return (
			<div className="pl-6 pb-10 flex justify-center items-center h-[60vh]">
				<div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#295c60]"></div>
				<span className="ml-3 font-mono">Cargando usuarios...</span>
			</div>
		);

	return (
		<div className="flex flex-col gap-4">
			{/* Cabecera + botón alta + botón refresh */}
			<div className="flex justify-between items-end mb-2">
				<h2 className="font-bold text-lg underline decoration-2 uppercase">
					Registros de Empleados
				</h2>

				<div className="flex gap-4 items-center">
					<button
						onClick={handleRefresh}
						disabled={isRefreshing}
						className="flex items-center gap-2 px-3 py-1.5 text-sm font-bold uppercase text-gray-600 hover:text-[#295c60] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						aria-label="Actualizar registros"
						title="Forzar actualización de datos"
					>
						<FaSync className={`${isRefreshing ? "animate-spin" : ""}`} />
						<span className="hidden sm:inline">Actualizar</span>
					</button>

					<button
						onClick={() => setShowCreateModal(true)}
						className="px-4 py-2 border-2 border-[#295c60] text-[#295c60] font-bold text-xs uppercase cursor-pointer hover:bg-[#295c60] hover:text-[#d2d4d1] transition-colors"
					>
						+ Registrar
					</button>
				</div>
			</div>

			{/* ── Barra de filtros ── */}
			<div className="flex flex-wrap gap-3 items-end border-y-2 border-dashed border-gray-400/50 py-3">
				<div className="flex-1 min-w-48">
					<label
						htmlFor="search-user"
						className="block text-xs font-bold uppercase opacity-60 mb-1"
					>
						Buscar
					</label>
					<input
						id="search-user"
						className="w-full bg-transparent border-b-2 border-gray-400 px-2 py-1 outline-none focus:border-[#295c60] text-sm"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Nombre de empleado…"
					/>
				</div>

				<div className="w-36">
					<label
						htmlFor="filter-role"
						className="block text-xs font-bold uppercase opacity-60 mb-1"
					>
						Rol
					</label>
					<select
						id="filter-role"
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
						Creación
						<SortArrow active={sortField === "joinedAt"} dir={sortDir} />
					</button>
				</div>
			</div>

			{/* ── Listado paginado (con opacidad durante carga) ── */}
			<div
				className={`transition-opacity duration-300 ${isRefreshing ? "opacity-50" : "opacity-100"}`}
			>
				<UserList
					users={users}
					currentUserId={currentUserId}
					onEdit={setEditingUser}
					onDelete={handleDelete}
					onGenerateTemp={generateTempPassword}
					getDisplayRole={getDisplayRole}
				/>
			</div>

			{users.length > 0 && (
				<Pagination
					page={page}
					totalPages={totalPages}
					pageSize={PAGE_SIZE}
					filteredCount={totalCount}
					totalCount={totalCount}
					onGoTo={goTo}
				/>
			)}

			{/* ── Modales ── */}
			{editingUser && (
				<EditUserModal
					user={editingUser}
					onClose={() => setEditingUser(null)}
					onSave={handleSaveFromModal}
				/>
			)}

			{showCreateModal && (
				<CreateUserModal
					onClose={() => setShowCreateModal(false)}
					onCreate={handleCreate}
				/>
			)}
		</div>
	);
}
