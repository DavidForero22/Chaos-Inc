// src/components/navbar/Navbar.tsx

import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import LoginModal from "./AuthModal/LoginModal";
import RegisterModal from "./AuthModal/RegisterModal";
import styles from "./Navbar.module.css";

import { FaRegUser, FaQuestion, FaBook } from "react-icons/fa";
import { IoHome, IoGameController } from "react-icons/io5";

export default function Navbar() {
	const { user, isGuest, role } = useAuthStore();

	const [showLogin, setShowLogin] = useState(false);
	const [showRegister, setShowRegister] = useState(false);

	const tabClass =
		(tabStyle: string) =>
		({ isActive }: { isActive: boolean }) =>
			`${styles.bookmark} ${tabStyle} ${isActive ? styles.bookmarkActive : ""}`;

	return (
		<>
			<div className={styles.bookmarksContainer}>
				{/* ── Pestañas de navegación principales ── */}
				<NavLink to="/" end className={tabClass(styles.tabHome)}>
					<IoHome />
					Inicio
				</NavLink>

				<NavLink to="/rooms" className={tabClass(styles.tabRooms)}>
					<IoGameController />
					Salas
				</NavLink>

				<NavLink to="/how-to-play" className={tabClass(styles.tabHowTo)}>
					<FaBook />
					Cómo Jugar
				</NavLink>

				<NavLink to="/know-more" className={tabClass(styles.tabKnow)}>
					<FaQuestion />
					Saber Más
				</NavLink>

				{/* ── Zona derecha: Perfil o acceso ── */}
				{user ? (
					<>
						{/* Admin si aplica */}
						{role === "admin" && !isGuest && (
							<NavLink
								to="/admin"
								className={tabClass(styles.adminTab)}
								title="Panel de Administración"
							>
								⚙ Admin
							</NavLink>
						)}

						{/* Pestaña de perfil con avatar */}
						<NavLink
							to="/profile"
							className={tabClass(styles.tabProfile)}
							title={isGuest ? "Expediente (Invitado)" : "Mi Expediente"}
						>
							<FaRegUser />

							{isGuest ? "Invitado" : "Perfil"}
						</NavLink>
					</>
				) : (
					/* Sin sesión: dos pestañas de acceso */
					<div className={styles.authGroup}>
						<button
							onClick={() => setShowRegister(true)}
							className={`${styles.bookmark} ${styles.tabRegister}`}
						>
							Registrarse
						</button>
						<button
							onClick={() => setShowLogin(true)}
							className={`${styles.bookmark} ${styles.tabLogin}`}
						>
							Iniciar Sesión
						</button>
					</div>
				)}
			</div>

			{/* ── Modales ── */}
			{showLogin && (
				<LoginModal
					onClose={() => setShowLogin(false)}
					onSwitchToRegister={() => {
						setShowLogin(false);
						setShowRegister(true);
					}}
				/>
			)}
			{showRegister && (
				<RegisterModal
					onClose={() => setShowRegister(false)}
					onSwitchToLogin={() => {
						setShowRegister(false);
						setShowLogin(true);
					}}
				/>
			)}
		</>
	);
}
