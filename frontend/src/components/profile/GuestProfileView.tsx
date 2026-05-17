// src/components/profile/GuestProfileView.tsx
// Accesibilidad comprobada: SI

import { useAuthStore } from "../../store/auth/useAuthStore.ts";
import styles from "./GuestProfileView.module.css";
import sharedStyles from "./Profile.module.css";

const SR_ONLY = {
	position: "absolute",
	width: "1px",
	height: "1px",
	padding: 0,
	margin: "-1px",
	overflow: "hidden",
	clip: "rect(0 0 0 0)",
	whiteSpace: "nowrap",
	border: 0,
} as const;

interface GuestProfileViewProps {
	onLogout: () => void;
}

export default function GuestProfileView({ onLogout }: GuestProfileViewProps) {
	const { user } = useAuthStore();

	return (
		<section
			className={styles.guestWrapper}
			role="region"
			aria-labelledby="guest-profile-title"
			aria-describedby="guest-profile-desc"
		>
			{/* Nombre */}
			<h1 id="guest-profile-title" className={styles.guestTitle}>
				{user}
			</h1>

			<p id="guest-profile-desc" className={styles.guestSubtitle}>
				Acceso temporal — Sin expediente permanente
			</p>

			{/* Explicación */}
			<div className={styles.guestBody}>
				<p className={styles.guestBodyText}>
					Está operando en modo invitado. Su sesión es temporal y no se registra
					historial de partidas ni estadísticas. Para obtener un expediente
					permanente, regístrese con una cuenta.
				</p>

				{/* Aviso de caducidad (alerta, anunciable inmediatamente) */}
				<div
					className={styles.guestWarning}
					role="alert"
					aria-live="assertive"
					aria-atomic="true"
					id="guest-warning"
				>
					<span className={styles.guestWarningIcon} aria-hidden="true">
						⚠
					</span>
					<p className={styles.guestWarningText}>
						<strong>Aviso:</strong> Las cuentas de invitado y todos sus datos
						asociados son eliminados automáticamente{" "}
						<strong>al día siguiente</strong> de su creación. Chaos Inc. no se
						responsabiliza de la pérdida de datos no consolidados.
					</p>
				</div>
			</div>

			{/* Acción */}
			<div className={styles.guestActions}>
				<button
					className={sharedStyles.actionBtnLogout}
					onClick={onLogout}
					type="button"
					aria-label="Cerrar sesión - eliminar cuenta de invitado"
					aria-describedby="guest-warning"
				>
					<span style={SR_ONLY}>
						Cerrar sesión y eliminar cuenta de invitado:{" "}
					</span>
					Cerrar sesión
				</button>
			</div>
		</section>
	);
}
