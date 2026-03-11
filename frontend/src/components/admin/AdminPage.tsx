import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore.ts";
import api from "../../api/axios.ts";

interface UserRecord {
	id: number;
	username: string;
	email: string;
	role: string;
	joinedAt: string;
}

interface RoomRecord {
	room_id: string;
	name: string;
	status: string;
	owner_name: string;
	max_players: string;
	players: string[];
}

interface GameRecord {
	id: number;
	winnerRole: string;
	totalRounds: number;
	totalEliminations: number;
	playedAt: string;
	players: {
		displayName: string;
		isGuest: boolean;
		stats: { role: string; hasWon: boolean };
	}[];
}

type Tab = "users" | "games" | "rooms";

export default function AdminPage() {
	const { role, token } = useAuthStore();
	const navigate = useNavigate();

	const [tab, setTab] = useState<Tab>("users");
	const [users, setUsers] = useState<UserRecord[]>([]);
	const [games, setGames] = useState<GameRecord[]>([]);
	const [rooms, setRooms] = useState<RoomRecord[]>([]);
	const [loading, setLoading] = useState(true);

	// Edición de usuario
	const [editingId, setEditingId] = useState<number | null>(null);
	const [editData, setEditData] = useState<{
		username: string;
		email: string;
		role: string;
	}>({ username: "", email: "", role: "user" });

	useEffect(() => {
		if (!token || role !== "admin") {
			navigate("/");
			return;
		}
		fetchAll();
	}, [token, role, navigate]);

	const fetchAll = async () => {
		setLoading(true);
		try {
			const [usersRes, gamesRes, roomsRes] = await Promise.all([
				api.get("/users"),
				api.get("/games"),
				api.get("/rooms"),
			]);
			setUsers(usersRes.data.data ?? usersRes.data);
			setGames(gamesRes.data.data ?? gamesRes.data);
			setRooms(roomsRes.data);
		} catch {
			navigate("/");
		} finally {
			setLoading(false);
		}
	};

	const handleDelete = async (id: number) => {
		if (!confirm("¿Eliminar este usuario?")) return;
		try {
			await api.delete(`/users/${id}`);
			setUsers(users.filter((u) => u.id !== id));
		} catch (e: any) {
			alert(e.response?.data?.message || "Error al eliminar.");
		}
	};

	const handleEditSave = async (id: number) => {
		try {
			const res = await api.put(`/users/${id}`, editData);
			setUsers(users.map((u) => (u.id === id ? { ...u, ...editData } : u)));
			setEditingId(null);
		} catch (e: any) {
			alert(e.response?.data?.message || "Error al actualizar.");
		}
	};

	if (loading)
		return (
			<div className="flex justify-center items-center h-[60vh]">
				<div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500"></div>
			</div>
		);

	return (
		<div className="max-w-5xl mx-auto py-6 flex flex-col gap-6">
			<div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
				<h1 className="text-2xl font-black text-white">
					⚙️ Panel de Administrador
				</h1>
			</div>

			{/* Tabs */}
			<div className="flex gap-2">
				{(["users", "games", "rooms"] as Tab[]).map((t) => (
					<button
						key={t}
						onClick={() => setTab(t)}
						className={`px-4 py-2 rounded font-bold text-sm transition ${
							tab === t
								? "bg-red-700 text-white"
								: "bg-gray-700 text-gray-400 hover:text-white"
						}`}
					>
						{t === "users"
							? "👤 Usuarios"
							: t === "games"
								? "🃏 Partidas"
								: "🏠 Salas"}
					</button>
				))}
			</div>

			{/* USUARIOS */}
			{tab === "users" && (
				<div className="bg-gray-800 rounded-xl border border-gray-700 p-6 flex flex-col gap-3">
					<h2 className="text-sm text-gray-400 uppercase font-bold mb-2">
						Usuarios registrados
					</h2>
					{users.map((u) => (
						<div
							key={u.id}
							className="bg-gray-900 rounded-lg border border-gray-700 p-4"
						>
							{editingId === u.id ? (
								<div className="flex flex-col gap-2">
									<input
										className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-white text-sm"
										value={editData.username}
										onChange={(e) =>
											setEditData({ ...editData, username: e.target.value })
										}
										placeholder="Username"
									/>
									<input
										className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-white text-sm"
										value={editData.email}
										onChange={(e) =>
											setEditData({ ...editData, email: e.target.value })
										}
										placeholder="Email"
									/>
									<select
										className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-white text-sm"
										value={editData.role}
										onChange={(e) =>
											setEditData({ ...editData, role: e.target.value })
										}
									>
										<option value="user">user</option>
										<option value="admin">admin</option>
									</select>
									<div className="flex gap-2">
										<button
											onClick={() => handleEditSave(u.id)}
											className="px-3 py-1 bg-green-700 hover:bg-green-600 text-white rounded text-sm font-bold"
										>
											Guardar
										</button>
										<button
											onClick={() => setEditingId(null)}
											className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
										>
											Cancelar
										</button>
									</div>
								</div>
							) : (
								<div className="flex justify-between items-center">
									<div>
										<p className="text-white font-bold">
											{u.username}
											<span
												className={`ml-2 text-xs px-2 py-0.5 rounded ${u.role === "admin" ? "bg-red-900 text-red-400" : "bg-gray-700 text-gray-400"}`}
											>
												{u.role}
											</span>
										</p>
										<p className="text-gray-500 text-xs">
											{u.email} ·{" "}
											{new Date(u.joinedAt).toLocaleDateString("es-ES")}
										</p>
									</div>
									<div className="flex gap-2">
										<button
											onClick={() => {
												setEditingId(u.id);
												setEditData({
													username: u.username,
													email: u.email,
													role: u.role,
												});
											}}
											className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
										>
											Editar
										</button>
										<button
											onClick={() => handleDelete(u.id)}
											className="px-3 py-1 bg-red-900/50 hover:bg-red-900 text-red-400 rounded text-sm"
										>
											Eliminar
										</button>
									</div>
								</div>
							)}
						</div>
					))}
				</div>
			)}

			{/* PARTIDAS */}
			{tab === "games" && (
				<div className="bg-gray-800 rounded-xl border border-gray-700 p-6 flex flex-col gap-3">
					<h2 className="text-sm text-gray-400 uppercase font-bold mb-2">
						Historial de partidas
					</h2>
					{games.length === 0 ? (
						<p className="text-gray-500 text-sm">
							No hay partidas registradas.
						</p>
					) : (
						games.map((g) => (
							<div
								key={g.id}
								className="bg-gray-900 rounded-lg border border-gray-700 p-4"
							>
								<div className="flex justify-between items-center mb-2">
									<p className="text-white font-bold">
										Partida #{g.id} — Ganador: {g.winnerRole}
									</p>
									<p className="text-gray-500 text-xs">
										{new Date(g.playedAt).toLocaleDateString("es-ES")} ·{" "}
										{g.totalRounds} rondas
									</p>
								</div>
								<div className="flex flex-wrap gap-2">
									{g.players?.map((p, i) => (
										<span
											key={i}
											className={`text-xs px-2 py-1 rounded border ${p.stats.hasWon ? "border-green-700 text-green-400" : "border-gray-700 text-gray-400"}`}
										>
											{p.displayName} {p.isGuest ? "(inv)" : ""} —{" "}
											{p.stats.role}
										</span>
									))}
								</div>
							</div>
						))
					)}
				</div>
			)}

			{/* SALAS EN CURSO */}
			{tab === "rooms" && (
				<div className="bg-gray-800 rounded-xl border border-gray-700 p-6 flex flex-col gap-3">
					<h2 className="text-sm text-gray-400 uppercase font-bold mb-2">
						Salas activas
					</h2>
					{rooms.length === 0 ? (
						<p className="text-gray-500 text-sm">No hay salas activas.</p>
					) : (
						rooms.map((r) => (
							<div
								key={r.room_id}
								className="bg-gray-900 rounded-lg border border-gray-700 p-4"
							>
								<div className="flex justify-between items-center">
									<div>
										<p className="text-white font-bold">
											{r.name}
											<span
												className={`ml-2 text-xs px-2 py-0.5 rounded ${r.status === "in_game" ? "bg-green-900 text-green-400" : "bg-yellow-900 text-yellow-400"}`}
											>
												{r.status === "in_game" ? "En partida" : "Esperando"}
											</span>
										</p>
										<p className="text-gray-500 text-xs">
											ID: {r.room_id} · Owner: {r.owner_name} ·{" "}
											{r.players.length}/{r.max_players} jugadores
										</p>
									</div>
									<div className="flex flex-wrap gap-1">
										{r.players.map((p) => (
											<span
												key={p}
												className="text-xs bg-gray-800 border border-gray-700 px-2 py-0.5 rounded text-gray-300"
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
			)}
		</div>
	);
}
