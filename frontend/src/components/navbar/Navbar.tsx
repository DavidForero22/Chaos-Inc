// src/components/navbar/Navbar.tsx

import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore.ts";
import LoginModal from "./LoginModal.tsx";
import RegisterModal from "./RegisterModal.tsx";
import styles from "../../pages/MainMenuPage.module.css";

export default function Navbar() {
	const { user, isGuest, role } = useAuthStore();

	const [showLogin, setShowLogin] = useState(false);
	const [showRegister, setShowRegister] = useState(false);

	return (
		<>
			{/* CABECERA (Tailwind Layout + Module colors) */}
			<nav
				className={`${styles.panel} px-6 py-4 flex justify-between items-center border-b shadow-sm`}
			>
				<div className="flex gap-10 items-center">
					{/* Logo (Texto Chaos Inc) */}
					<Link
						to="/"
						className="text-2xl font-black tracking-tight"
						style={{ color: "var(--off-secondary)" }}
					>
						CHAOS INC.
					</Link>

					{/* Links de navegación */}
					<div className="flex gap-6">
						<Link
							to="/rooms"
							className="text-sm font-medium hover:opacity-80 transition"
							style={{ color: "var(--off-text)" }}
						>
							Salas
						</Link>
						<Link
							to="#"
							className="text-sm font-medium hover:opacity-80 transition"
							style={{ color: "var(--off-text)" }}
						>
							Cómo Jugar
						</Link>
						<Link
							to="#"
							className="text-sm font-medium hover:opacity-80 transition"
							style={{ color: "var(--off-text)" }}
						>
							Saber Más
						</Link>
					</div>
				</div>

				<div className="flex gap-4 items-center">
					{user ? (
						<div className="flex gap-4 items-center">
							{/* Link de Admin (Si aplica) */}
							{role === "admin" && !isGuest && (
								<Link
									to="/admin"
									className="text-sm font-bold transition hover:opacity-80"
									style={{ color: "var(--off-secondary)" }}
									title="Panel de Administración"
								>
									⚙️ Admin
								</Link>
							)}

							{/* Perfil Circle (Usuario logueado o invitado) */}
							<Link
								to="/profile"
								title={isGuest ? "Expediente (Invitado)" : "Ir al expediente"}
								className="group"
							>
								<div
									className="w-10 h-10 rounded-full border-2 flex items-center justify-center text-xs font-bold transition group-hover:opacity-80"
									style={{
										backgroundColor: "var(--off-primary)",
										borderColor: "var(--off-secondary)",
										color: "var(--off-panel)",
									}}
								>
									{user.substring(0, 2).toUpperCase()}
								</div>
							</Link>
						</div>
					) : (
						// No está con usuario (Mostramos botones estilo Severance)
						<div className="flex gap-3">
							<button
								onClick={() => setShowLogin(true)}
								className="text-sm px-4 py-1.5 font-medium transition hover:opacity-80"
								style={{ color: "var(--off-secondary)" }}
							>
								Iniciar Sesión
							</button>
							<button
								onClick={() => setShowRegister(true)}
								className="text-sm px-4 py-1.5 rounded font-medium transition shadow-sm hover:opacity-90"
								style={{
									backgroundColor: "var(--off-primary)",
									color: "var(--off-panel)",
								}}
							>
								Registrarse
							</button>
						</div>
					)}
				</div>
			</nav>

			{/* Modales abstraídos */}
			{showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
			{showRegister && <RegisterModal onClose={() => setShowRegister(false)} />}
		</>
	);
}
