// src/pages/AdminPage.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore.ts";
import { useAdminData } from "../hooks/admin/useAdminData.ts";

import UsersTab from "../components/admin/UsersTab.tsx";
import GamesTab from "../components/admin/GamesTab.tsx";
import RoomsTab from "../components/admin/RoomsTab.tsx";

type Tab = "users" | "games" | "rooms";

export default function AdminPage() {
	const { role, token } = useAuthStore();
	const navigate = useNavigate();
	const [tab, setTab] = useState<Tab>("users");

	const {
		users,
		games,
		rooms,
		loading,
		fetchAll,
		deleteUser,
		updateUser,
		createUser,
	} = useAdminData();

	useEffect(() => {
		if (!token || role !== "admin") {
			navigate("/");
			return;
		}
		fetchAll();
	}, [token, role, navigate, fetchAll]);

	if (loading)
		return (
			<div className="pl-6 pb-10 flex justify-center items-center h-[60vh]">
				<div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#295c60]"></div>
				<span>Cargando datos...</span>
			</div>
		);

	return (
		<div className="pl-6 pb-10 pr-6">
			{/* Cabecera Oficial */}
			<h1
				className="text-4xl mb-6 font-black uppercase"
				style={{ color: "var(--color-lomo)" }}
			>
				Panel de Dirección
			</h1>
			<h2 className="text-xl mb-6 opacity-80 border-b border-gray-400 pb-2 font-bold">
				Nivel de Autorización: Máximo
			</h2>

			{/* Pestañas de Navegación Interna */}
			<div className="flex flex-wrap gap-2 mb-8 border-b border-gray-400/30 pb-4">
				{(["users", "games", "rooms"] as Tab[]).map((t) => (
					<button
						key={t}
						onClick={() => setTab(t)}
						className={`font-mono text-sm font-bold uppercase tracking-wider px-4 py-2 border-2 rounded-sm transition-all ${
							tab === t
								? "bg-[#393e42] border-[#393e42] text-[#d2d4d1]"
								: "bg-transparent border-[#8f9e9b] text-[#8f9e9b] hover:border-[#393e42] hover:text-[#393e42]"
						}`}
					>
						{t === "users"
							? "📄 Usuarios"
							: t === "games"
								? "📂 Partidas"
								: "🏢 Salas Activas"}
					</button>
				))}
			</div>

			{/* Contenedor de la pestaña activa */}
			<div className="font-mono text-[#393e42]">
				{tab === "users" && (
					<UsersTab
						users={users}
						onDelete={deleteUser}
						onUpdate={updateUser}
						onCreate={createUser}
					/>
				)}
				{tab === "games" && <GamesTab games={games} />}
				{tab === "rooms" && <RoomsTab rooms={rooms} />}
			</div>
		</div>
	);
}
