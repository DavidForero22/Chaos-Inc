import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore.ts";
import { useAdminData } from "../../hooks/admin/useAdminData.ts";
import UsersTab from "./UsersTab.tsx";
import GamesTab from "./GamesTab.tsx";
import RoomsTab from "./RoomsTab.tsx";
import { useState } from "react";

type Tab = "users" | "games" | "rooms";

export default function AdminPage() {
	const { role, token } = useAuthStore();
	const navigate = useNavigate();
	const [tab, setTab] = useState<Tab>("users");
	const { users, games, rooms, loading, fetchAll, deleteUser, updateUser } =
		useAdminData();

	useEffect(() => {
		if (!token || role !== "admin") {
			navigate("/");
			return;
		}
		fetchAll();
	}, [token, role, navigate, fetchAll]);

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

			<div className="flex gap-2">
				{(["users", "games", "rooms"] as Tab[]).map((t) => (
					<button
						key={t}
						onClick={() => setTab(t)}
						className={`px-4 py-2 rounded font-bold text-sm transition ${tab === t ? "bg-red-700 text-white" : "bg-gray-700 text-gray-400 hover:text-white"}`}
					>
						{t === "users"
							? "👤 Usuarios"
							: t === "games"
								? "🃏 Partidas"
								: "🏠 Salas"}
					</button>
				))}
			</div>

			{tab === "users" && (
				<UsersTab users={users} onDelete={deleteUser} onUpdate={updateUser} />
			)}
			{tab === "games" && <GamesTab games={games} />}
			{tab === "rooms" && <RoomsTab rooms={rooms} />}
		</div>
	);
}
