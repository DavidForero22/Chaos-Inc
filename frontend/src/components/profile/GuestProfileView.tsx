// src/components/profile/GuestProfileView.tsx
// Accesibilidad comprobada: SI

import { useAuthStore } from "../../store/auth/useAuthStore.ts";
import styles from "./GuestViews.module.css";

interface GuestProfileViewProps {
	onLogout: () => void;
}

export default function GuestProfileView({ onLogout }: GuestProfileViewProps) {
	const { user } = useAuthStore();

	return (
		<main
			className={styles.wrapper}
			role="region"
			aria-labelledby="guest-profile-title"
			aria-describedby="guest-profile-desc"
		>
			<div className={styles.icon} aria-hidden="true">
				⚠
			</div>

			<h1 id="guest-profile-title" className={styles.title}>
				{user}
			</h1>

			<p id="guest-profile-desc" className={styles.subtitle}>
				Acceso temporal — Sin perfil permanente
			</p>

			<div className={styles.message}>
				Estás en modo invitado. Tu sesión es temporal y no se registra
				historial de partidas ni estadísticas. Para obtener un perfil
				permanente, regístrate con una cuenta.
			</div>

			<div
				className={styles.warning}
				role="alert"
				aria-live="assertive"
				aria-atomic="true"
			>
				<strong>Aviso:</strong> Las cuentas de invitado y todos sus datos
				asociados son eliminados automáticamente{" "}
				<strong>al día siguiente</strong> de su creación.
			</div>

			<div className={styles.actions}>
				<button
					className={styles.logoutBtn}
					onClick={onLogout}
					type="button"
					aria-label="Cerrar sesión - eliminar cuenta de invitado"
				>
					[ CERRAR SESIÓN ]
				</button>
			</div>
		</main>
	);
}
