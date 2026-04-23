// src/components/navbar/Navbar.tsx

import { useEffect, useState } from "react";
import { useAuthStore } from "../../../store/useAuthStore";
import LoginModal from "../AuthModal/LoginModal";
import RegisterModal from "../AuthModal/RegisterModal";
import { NavLinks } from "./NavLinks";
import styles from "./Navbar.module.css";

import { FaBars } from "react-icons/fa";

export default function Navbar() {
	const { user, isGuest, role } = useAuthStore();
	const [showLogin, setShowLogin] = useState(false);
	const [showRegister, setShowRegister] = useState(false);
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [disableMenuTransition, setDisableMenuTransition] = useState(false);

	// Props comunes que necesitan los enlaces
	const navProps = {
		user,
		isGuest,
		role,
		setShowLogin,
		setShowRegister,
	};

	useEffect(() => {
		const mediaQuery = window.matchMedia("(max-width: 1050px)");

		const handleBreakpointChange = (e: MediaQueryListEvent) => {
			// Si pasamos a escritorio (>1050px), cerrar menú sin animación
			if (!e.matches) {
				setDisableMenuTransition(true);
				setIsMenuOpen(false);
			}
		};

		mediaQuery.addEventListener("change", handleBreakpointChange);

		return () => {
			mediaQuery.removeEventListener("change", handleBreakpointChange);
		};
	}, []);

	useEffect(() => {
		if (!disableMenuTransition) return;

		const id = requestAnimationFrame(() => {
			setDisableMenuTransition(false);
		});

		return () => cancelAnimationFrame(id);
	}, [disableMenuTransition]);

	return (
		<>
			<div className={styles.bookmarksContainer}>
				{/* ── GRUPO DE ESCRITORIO  ── */}
				<div className={styles.desktopGroup}>
					<NavLinks {...navProps} isMobile={false} />
				</div>

				{/* ── GRUPO MÓVIL ── */}
				<button
					className={`${styles.bookmark} ${styles.mobileMenuTab}`}
					onClick={() => setIsMenuOpen(!isMenuOpen)}
					title="Abrir Menú"
				>
					<FaBars /> MENÚ
				</button>

				{/* Desplegable Móvil */}
				<div
					className={`${styles.dropdownMenu} ${
						isMenuOpen ? styles.dropdownMenuOpen : ""
					} ${disableMenuTransition ? styles.dropdownMenuNoTransition : ""}`}
				>
					<NavLinks
						{...navProps}
						isMobile={true}
						onItemClick={() => setIsMenuOpen(false)}
					/>
				</div>
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
