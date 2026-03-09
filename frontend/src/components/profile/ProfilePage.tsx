import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore.ts";
import api from "../../api/axios.ts";
import type { GameRecord } from "../../types/types.ts";

const ROLE_LABELS: Record<string, string> = {
	boss: "👑 Jefe",
	secretary: "📋 Secretario",
	intern: "🎓 Becario",
	union: "✊ Sindicalista",
};

export default function ProfilePage() {
	const { user, token, isGuest, logout } = useAuthStore();
	const navigate = useNavigate();

	const [games, setGames] = useState<GameRecord[]>([]);
	const [loading, setLoading] = useState(true);
	const [confirmDelete, setConfirmDelete] = useState(false);
	const [meId, setMeId] = useState<number | null>(null);

	useEffect(() => {
		if (!token || isGuest) {
			navigate("/");
			return;
		}

		const fetchData = async () => {
			try {
				const [meRes, gamesRes] = await Promise.all([
					api.get("/me"),
					api.get("/me/games"),
				]);
				setMeId(meRes.data.id);
				setGames(gamesRes.data.data ?? gamesRes.data);
			} catch {
				navigate("/");
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [token, isGuest, navigate]);

	const handleLogout = async () => {
		try {
			await api.post("/logout");
		} catch {}
		logout();
		navigate("/");
	};

	const handleDeleteAccount = async () => {
		if (!meId) return;
		try {
			await api.delete(`/users/${meId}`);
			logout();
			navigate("/");
		} catch (e: any) {
			alert(e.response?.data?.message || "Error al eliminar la cuenta.");
		}
	};

	// Calcular totales
	const myStats = games.reduce(
		(acc, game) => {
			const me = game.players.find((p) => p.displayName === user);
			if (!me) return acc;
			return {
				wins: acc.wins + (me.stats.hasWon ? 1 : 0),
				damage: acc.damage + me.stats.damageDealt,
				received: acc.received + me.stats.damageReceived,
				cards: acc.cards + me.stats.cardsPlayed,
				eliminations: acc.eliminations + me.stats.eliminations,
			};
		},
		{ wins: 0, damage: 0, received: 0, cards: 0, eliminations: 0 },
	);

	if (loading) {
		return (
			<div className="flex justify-center items-center h-[60vh]">
				<div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
			</div>
		);
	}

	return (
		<div className="max-w-3xl mx-auto py-6 flex flex-col gap-6">
			{/* Cabecera */}
			<div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
				<h1 className="text-2xl font-black text-white mb-1">👤 {user}</h1>
				<p className="text-gray-500 text-sm">{games.length} partidas jugadas</p>
			</div>

			{/* Estadísticas globales */}
			<div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
				<h2 className="text-sm text-gray-400 uppercase font-bold mb-4">
					Estadísticas globales
				</h2>
				<div className="grid grid-cols-3 gap-4 text-center">
					{[
						{ label: "Victorias", value: myStats.wins },
						{ label: "Derrotas", value: games.length - myStats.wins },
						{ label: "Eliminaciones", value: myStats.eliminations },
						{ label: "Daño infligido", value: myStats.damage },
						{ label: "Daño recibido", value: myStats.received },
						{ label: "Cartas jugadas", value: myStats.cards },
					].map(({ label, value }) => (
						<div
							key={label}
							className="bg-gray-900 rounded-lg p-3 border border-gray-700"
						>
							<p className="text-xs text-gray-500 uppercase mb-1">{label}</p>
							<p className="text-xl font-black text-white">{value}</p>
						</div>
					))}
				</div>
			</div>

			{/* Historial */}
			<div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
				<h2 className="text-sm text-gray-400 uppercase font-bold mb-4">
					Historial de partidas
				</h2>
				{games.length === 0 ? (
					<p className="text-gray-500 text-sm">
						Aún no has jugado ninguna partida registrada.
					</p>
				) : (
					<div className="flex flex-col gap-3">
						{games.map((game) => {
							const me = game.players.find((p) => p.displayName === user);
							if (!me) return null;
							return (
								<div
									key={game.id}
									className={`rounded-lg border p-4 flex justify-between items-center ${
										me.stats.hasWon
											? "bg-green-900/20 border-green-800"
											: "bg-red-900/10 border-red-900"
									}`}
								>
									<div>
										<p className="text-sm font-bold text-white">
											{me.stats.hasWon ? "🏆 Victoria" : "💀 Derrota"} —{" "}
											{ROLE_LABELS[me.stats.role] ?? me.stats.role}
										</p>
										<p className="text-xs text-gray-500 mt-1">
											{new Date(game.playedAt).toLocaleDateString("es-ES")} ·{" "}
											{game.totalRounds} rondas
										</p>
									</div>
									<div className="text-right text-xs text-gray-400">
										<p>⚔️ {me.stats.damageDealt} daño</p>
										<p>🃏 {me.stats.cardsPlayed} cartas</p>
										<p>💀 {me.stats.eliminations} elim.</p>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>

			{/* Acciones */}
			<div className="bg-gray-800 rounded-xl border border-gray-700 p-6 flex flex-col gap-3">
				<button
					onClick={handleLogout}
					className="w-full py-2 rounded bg-gray-700 hover:bg-gray-600 text-white font-bold transition text-sm"
				>
					Cerrar sesión
				</button>

				{!confirmDelete ? (
					<button
						onClick={() => setConfirmDelete(true)}
						className="w-full py-2 rounded bg-red-900/40 hover:bg-red-900/70 text-red-400 font-bold transition text-sm border border-red-800"
					>
						Eliminar cuenta
					</button>
				) : (
					<div className="bg-red-900/20 border border-red-700 rounded-lg p-4 flex flex-col gap-2">
						<p className="text-sm text-red-300 font-semibold text-center">
							¿Seguro? Esta acción no se puede deshacer.
						</p>
						<div className="flex gap-2">
							<button
								onClick={() => setConfirmDelete(false)}
								className="flex-1 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white text-sm font-bold transition"
							>
								Cancelar
							</button>
							<button
								onClick={handleDeleteAccount}
								className="flex-1 py-2 rounded bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition"
							>
								Sí, eliminar
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
