// src/components/navbar/Navbar.tsx
// Accesibilidad comprobada: SI

import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "../../../store/auth/useAuthStore.ts";
import LoginModal from "../Modals/AuthModal/LoginModal.tsx";
import RegisterModal from "../Modals/AuthModal/RegisterModal.tsx";
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

	// Cerrar menú con tecla Escape
	useEffect(() => {
		if (!isMenuOpen) return;

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setIsMenuOpen(false);
				// Devolver foco al botón del menú
				const menuButton = document.querySelector(`.${styles.mobileMenuTab}`);
				if (menuButton instanceof HTMLElement) {
					menuButton.focus();
				}
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [isMenuOpen]);

	return (
		<>
			<nav
				className={styles.bookmarksContainer}
				aria-label="Navegación principal"
			>
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
						aria-label="Abrir menú de navegación"
						aria-expanded={isMenuOpen}
						aria-haspopup="menu"
					>
						<FaBars aria-hidden="true" /> MENÚ
					</button>

					{/* Desplegable Móvil */}
					<div
						className={`${styles.dropdownMenu} ${
							isMenuOpen ? styles.dropdownMenuOpen : ""
						} ${disableMenuTransition ? styles.dropdownMenuNoTransition : ""}`}
						role="menu"
						aria-label="Menú de navegación móvil"
						aria-hidden={!isMenuOpen}
						inert={!isMenuOpen ? true : undefined}
					>
						<NavLinks
							{...navProps}
							isMobile={true}
							onItemClick={() => {
								setIsMenuOpen(false);
								// Volver el foco al botón del menú
								const menuButton = document.querySelector(
									`.${styles.mobileMenuTab}`,
								);
								if (menuButton instanceof HTMLElement) {
									menuButton.focus();
								}
							}}
						/>
					</div>
				</div>
			</nav>

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
