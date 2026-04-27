// src/components/navbar/Navbar.tsx

import { useEffect, useRef, useState } from "react";
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
	const menuWrapperRef = useRef<HTMLDivElement>(null);

	// Props comunes que necesitan los enlaces
	const navProps = {
		user,
		isGuest,
		role,
		setShowLogin,
		setShowRegister,
	};

	// Asignar un listener para cuando se cambie la resolucion de la pantalla
	useEffect(() => {
		const mediaQuery = window.matchMedia("(max-width: 1050px)");

		const handleBreakpointChange = (e: MediaQueryListEvent) => {
			// Si pasa a escritorio (>1050px), cerrar menú sin animación
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

	// Cerrar al instante el menu desplegable
	useEffect(() => {
		if (!disableMenuTransition) return;

		const id = requestAnimationFrame(() => {
			setDisableMenuTransition(false);
		});

		return () => cancelAnimationFrame(id);
	}, [disableMenuTransition]);

	// Cerrar menu desplegable si se hace click fuera
	useEffect(() => {
		if (!isMenuOpen) return;

		const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
			const target = event.target;
			if (!(target instanceof Node)) return;

			if (menuWrapperRef.current && !menuWrapperRef.current.contains(target)) {
				setIsMenuOpen(false);
			}
		};

		document.addEventListener("mousedown", handleOutsideClick);
		document.addEventListener("touchstart", handleOutsideClick);

		return () => {
			document.removeEventListener("mousedown", handleOutsideClick);
			document.removeEventListener("touchstart", handleOutsideClick);
		};
	}, [isMenuOpen]);

	return (
		<>
			<div className={styles.bookmarksContainer}>
				{/* ── GRUPO DE ESCRITORIO  ── */}
				<div className={styles.desktopGroup}>
					<NavLinks {...navProps} isMobile={false} />
				</div>

				{/* ── GRUPO MÓVIL ── */}
				<div ref={menuWrapperRef}>
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
