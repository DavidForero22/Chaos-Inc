// src/pages/AdminPage.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore.ts";

import UsersTab from "../components/admin/UsersTab.tsx";
import GamesTab from "../components/admin/GamesTab.tsx";
import RoomsTab from "../components/admin/RoomsTab.tsx";

type Tab = "users" | "games" | "rooms";

export default function AdminPage() {
	// 1. Eliminamos 'token' de aquí, ya no existe en el store
	const { role, user } = useAuthStore();
	const navigate = useNavigate();
	const [tab, setTab] = useState<Tab>("users");

	useEffect(() => {
		// 2. Ahora comprobamos que el usuario esté logueado y sea admin
		// Si no hay user, significa que no hay sesión activa en el cliente
		if (!user || role !== "admin") {
			navigate("/");
			return;
		}
	}, [user, role, navigate]); // 'user' reemplaza a 'token' como dependencia

	return (
		<div className="pl-6 pb-10 pr-6">
			{/* Cabecera Oficial */}
			<h1
				className="text-4xl mb-6 font-black uppercase"
				style={{ color: "var(--color-lomo)" }}
			>
				Panel de Administración
			</h1>

			{/* Pestañas */}
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
								: "🏢 Salas"}
					</button>
				))}
			</div>

			<div className="font-mono text-[#393e42]">
				{tab === "users" && (
					<UsersTab currentUser={user}/>
				)}
				{tab === "games" && <GamesTab />}
				{tab === "rooms" && <RoomsTab/>}
			</div>
		</div>
	);
}
