// src/layouts/NotebookLayout.tsx

import { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import LoginModal from "../components/navbar/LoginModal";
import RegisterModal from "../components/navbar/RegisterModal";
import styles from "./NotebookLayout.module.css";

export default function NotebookLayout() {
	const [showLogin, setShowLogin] = useState(false);
	const [showRegister, setShowRegister] = useState(false);

	// Helper para combinar clases de pestaña con clase activa
	const tabClass =
		(tabStyle: string) =>
		({ isActive }: { isActive: boolean }) =>
			`${styles.bookmark} ${tabStyle} ${isActive ? styles.bookmarkActive : ""}`;

	return (
		<div className={styles.pageWrapper}>
			<div className={styles.notebookContainer}>
				{/* ── PESTAÑAS / MARCAPÁGINAS ── */}
				<div className={styles.bookmarksContainer}>
					<NavLink to="/" end className={tabClass(styles.tabHome)}>
						Inicio
					</NavLink>

					<NavLink to="/rooms" className={tabClass(styles.tabRooms)}>
						Salas
					</NavLink>

					<NavLink to="/how-to-play" className={tabClass(styles.tabHowTo)}>
						Como jugar
					</NavLink>

					<NavLink to="/know-more" className={tabClass(styles.tabKnow)}>
						Saber Más
					</NavLink>

					<NavLink to="/profile" className={tabClass(styles.tabPerfil)}>
						Perfil
					</NavLink>
				</div>

				{/* ── LOMO ── */}
				<div className={styles.notebookSpine} />

				{/* ── HOJA DE PAPEL ── */}
				<div className={styles.notebookPaper}>
					{/* ── CONTENIDO DE LA PÁGINA HIJA ── */}
					<Outlet />
				</div>
			</div>

			{/* ── MODALES ── */}
			{showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
			{showRegister && <RegisterModal onClose={() => setShowRegister(false)} />}
		</div>
	);
}
