// src/components/navbar/NavLinks.tsx

import { NavLink } from "react-router-dom";
import { FaRegUser, FaQuestion, FaBook, FaFolder } from "react-icons/fa";
import { IoHome, IoGameController } from "react-icons/io5";
import styles from "./Navbar.module.css";

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
			>
				<IoHome /> Inicio
			</NavLink>

			<NavLink
				to="/rooms"
				className={getLinkClass(styles.tabRooms)}
				onClick={onItemClick}
			>
				<IoGameController /> Salas
			</NavLink>

			<NavLink
				to="/how-to-play"
				className={getLinkClass(styles.tabHowTo)}
				onClick={onItemClick}
			>
				<FaBook /> Cómo Jugar
			</NavLink>

			<NavLink
				to="/know-more"
				className={getLinkClass(styles.tabKnow)}
				onClick={onItemClick}
			>
				<FaQuestion /> Saber Más
			</NavLink>

			{/* ── Zona de Perfil o Autenticación ── */}
			{user ? (
				<div className={isMobile ? styles.mobileUserGroup : styles.userGroup}>
					{role === "admin" && !isGuest && (
						<NavLink
							to="/admin"
							className={getLinkClass(styles.tabAdmin)}
							onClick={onItemClick}
						>
							<FaFolder /> Admin
						</NavLink>
					)}
					<NavLink
						to="/profile"
						className={getLinkClass(styles.tabProfile)}
						onClick={onItemClick}
					>
						<FaRegUser /> {isGuest ? "Invitado" : "Perfil"}
					</NavLink>
				</div>
			) : (
				<div className={isMobile ? styles.mobileUserGroup : styles.authGroup}>
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
					>
						Iniciar Sesión
					</button>
				</div>
			)}
		</>
	);
}
