// src/components/profile/GuestNotAvailableView.tsx
// Accesibilidad comprobada: SI

import styles from "./GuestViews.module.css";

interface GuestNotAvailableViewProps {
	username: string;
}

export default function GuestNotAvailableView({
	username,
}: GuestNotAvailableViewProps) {
	return (
		<main
			className={styles.wrapper}
			role="alert"
			aria-live="assertive"
			aria-label="Perfil no disponible"
		>
			<div className={styles.icon} aria-hidden="true">
				⚠
			</div>

			<h1 className={styles.title}>{username}</h1>

			<p className={styles.subtitle}>
				Perfil no disponible — Cuenta de invitado
			</p>

			<div className={styles.message}>
				El usuario <strong>{username}</strong> es una cuenta de invitado
				temporal.
			</div>

			<div className={styles.description}>
				Las cuentas de invitado no disponen de perfil público, historial de
				partidas ni estadísticas permanentes. Estos perfiles son eliminados
				automáticamente y no pueden ser consultados por otros usuarios.
			</div>
		</main>
	);
}
