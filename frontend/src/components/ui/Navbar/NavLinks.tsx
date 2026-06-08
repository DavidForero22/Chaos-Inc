// src/components/navbar/NavLinks.tsx
// Accesibilidad comprobada: SI

import { NavLink } from "react-router-dom";
import { FaQuestion, FaBook, FaFolder, FaTrophy } from "react-icons/fa";
import { IoHome, IoGameController } from "react-icons/io5";
import styles from "./Navbar.module.css";
import { GoPersonFill } from "react-icons/go";

interface NavLinksProps {
	isMobile?: boolean;
	user: any | null;
	isGuest: boolean;
	role: string | null;
	setShowLogin: (show: boolean) => void;
	setShowRegister: (show: boolean) => void;
	onItemClick?: () => void; // Para cerrar el menú al hacer click en móvil
}

export function NavLinks({
	isMobile = false,
	user,
	isGuest,
	role,
	setShowLogin,
	setShowRegister,
	onItemClick,
}: NavLinksProps) {
	// Función para asignar las clases dependiendo de la vista (Móvil vs Escritorio)
	const getLinkClass =
		(desktopTabStyle: string) =>
		({ isActive }: { isActive: boolean }) => {
			if (isMobile) {
				return `${styles.mobileItem} ${isActive ? styles.mobileItemActive : ""}`;
			}
			return `${styles.bookmark} ${desktopTabStyle} ${isActive ? styles.bookmarkActive : ""}`;
		};

	return (
		<>
			<NavLink
				to="/"
				end
				className={getLinkClass(styles.tabHome)}
				onClick={onItemClick}
				aria-label="Ir a la página de inicio"
			>
				<IoHome aria-hidden="true" /> Inicio
			</NavLink>

			<NavLink
				to="/rooms"
				className={getLinkClass(styles.tabRooms)}
				onClick={onItemClick}
				aria-label="Ver todas las salas disponibles"
			>
				<IoGameController aria-hidden="true" /> Salas
			</NavLink>

			<NavLink
				to="/leaderboard"
				className={getLinkClass(styles.tabLeaderboard)}
				onClick={onItemClick}
				aria-label="Clasificación de jugadores"
			>
				<FaTrophy  aria-hidden="true" /> Clasificación
			</NavLink>

			<NavLink
				to="/how-to-play"
				className={getLinkClass(styles.tabHowTo)}
				onClick={onItemClick}
				aria-label="Ver instrucciones y reglas del juego"
			>
				<FaBook aria-hidden="true" /> Cómo Jugar
			</NavLink>

			<NavLink
				to="/know-more"
				className={getLinkClass(styles.tabKnow)}
				onClick={onItemClick}
				aria-label="Más información sobre Chaos Inc."
			>
				<FaQuestion aria-hidden="true" /> Saber Más
			</NavLink>

			{/* ── Zona de Perfil o Autenticación ── */}
			{user ? (
				<div
					className={isMobile ? styles.mobileUserGroup : styles.userGroup}
					role="group"
					aria-label="Acciones de usuario"
				>
					{role === "admin" && !isGuest && (
						<NavLink
							to="/admin"
							className={getLinkClass(styles.tabAdmin)}
							onClick={onItemClick}
							aria-label="Panel de administración"
						>
							<FaFolder aria-hidden="true" /> Admin
						</NavLink>
					)}
					<NavLink
						to="/profile"
						className={getLinkClass(styles.tabProfile)}
						onClick={onItemClick}
						aria-label={isGuest ? "Perfil de invitado" : "Ver mi perfil"}
					>
						<GoPersonFill  aria-hidden="true" /> {isGuest ? "Invitado" : "Perfil"}
					</NavLink>
				</div>
			) : (
				<div
					className={isMobile ? styles.mobileUserGroup : styles.authGroup}
					role="group"
					aria-label="Opciones de autenticación"
				>
					<button
						onClick={() => {
							setShowRegister(true);
							onItemClick?.();
						}}
						className={
							isMobile
								? styles.mobileItem
								: `${styles.bookmark} ${styles.tabRegister}`
						}
						aria-label="Crear una nueva cuenta"
					>
						Registrarse
					</button>
					<button
						onClick={() => {
							setShowLogin(true);
							onItemClick?.();
						}}
						className={
							isMobile
								? styles.mobileItem
								: `${styles.bookmark} ${styles.tabLogin}`
						}
						aria-label="Iniciar sesión con cuenta existente"
					>
						Iniciar Sesión
					</button>
				</div>
			)}
		</>
	);
}
