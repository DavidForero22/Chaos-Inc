// src/pages/AdminPage.tsx
// Accesibilidad comprobada: SI

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth/useAuthStore.ts";

import UsersTab from "../components/admin/UsersTab.tsx";
import GamesTab from "../components/admin/GamesTab.tsx";
import RoomsTab from "../components/admin/RoomsTab.tsx";

type Tab = "users" | "games" | "rooms";

export default function AdminPage() {
	const { role, user } = useAuthStore();
	const navigate = useNavigate();
	const [tab, setTab] = useState<Tab>("users");

	useEffect(() => {
		if (!user || role !== "admin") {
			navigate("/");
			return;
		}
	}, [user, role, navigate]);

	return (
		<main className="pl-6 pb-10 pr-6">
			{/* Cabecera */}
			<header>
				<h1
					className="text-4xl mb-6 font-black uppercase"
					style={{ color: "var(--color-lomo)" }}
				>
					Panel de Administración
				</h1>
			</header>

			{/* Pestañas de navegación */}
			<nav
				className="flex flex-wrap gap-2 mb-8 border-b border-gray-400/30 pb-4"
				aria-label="Secciones de administración"
			>
				{(["users", "games", "rooms"] as Tab[]).map((t) => (
					<button
						key={t}
						onClick={() => setTab(t)}
						className={`font-mono text-sm font-bold uppercase tracking-wider px-4 py-2 border-2 rounded-sm transition-all ${
							tab === t
								? "bg-[#393e42] border-[#393e42] text-[#d2d4d1]"
								: "bg-transparent border-[#8f9e9b] text-[#8f9e9b] hover:border-[#393e42] hover:text-[#393e42]"
						}`}
						aria-label={`Ver ${t === "users" ? "usuarios" : t === "games" ? "partidas" : "salas"}`}
						aria-pressed={tab === t}
					>
						{t === "users" && <span aria-hidden="true"></span>}
						{t === "games" && <span aria-hidden="true"></span>}
						{t === "rooms" && <span aria-hidden="true"></span>}
						{t === "users" ? "Usuarios" : t === "games" ? "Partidas" : "Salas"}
					</button>
				))}
			</nav>

			<section
				className="font-mono text-[#393e42]"
				aria-label={`Contenido de ${tab === "users" ? "usuarios" : tab === "games" ? "partidas" : "salas"}`}
				aria-live="polite"
			>
				{tab === "users" && <UsersTab />}
				{tab === "games" && <GamesTab />}
				{tab === "rooms" && <RoomsTab />}
			</section>
		</main>
	);
}
