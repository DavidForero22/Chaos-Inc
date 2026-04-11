// src/components/navbar/Navbar.tsx

import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import LoginModal from "./AuthModal/LoginModal";
import RegisterModal from "./AuthModal/RegisterModal";
import styles from "./Navbar.module.css";

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
					Inicio
				</NavLink>

				<NavLink to="/rooms" className={tabClass(styles.tabRooms)}>
					Salas
				</NavLink>

				<NavLink to="/how-to-play" className={tabClass(styles.tabHowTo)}>
					Cómo Jugar
				</NavLink>

				<NavLink to="/know-more" className={tabClass(styles.tabKnow)}>
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
							<span className={styles.profileTabContent}>
								<span className={styles.profileAvatar}>
									{user.substring(0, 2).toUpperCase()}
								</span>
								{isGuest ? "Invitado" : "Perfil"}
							</span>
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
