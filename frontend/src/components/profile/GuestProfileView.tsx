// src/components/profile/GuestProfileView.tsx

import { useAuthStore } from "../../store/useAuthStore";
import styles from "./GuestProfileView.module.css";
import sharedStyles from "./Profile.module.css";


interface GuestProfileViewProps {
	onLogout: () => void;
}

export default function GuestProfileView({ onLogout }: GuestProfileViewProps) {
	const { user } = useAuthStore();

	return (
		<div className={styles.guestWrapper}>
			{/* Nombre */}
			<h1 className={styles.guestTitle}>{user}</h1>
			<p className={styles.guestSubtitle}>
				Acceso temporal — Sin expediente permanente
			</p>

			{/* Explicación */}
			<div className={styles.guestBody}>
				<p className={styles.guestBodyText}>
					Está operando en modo invitado. Su sesión es temporal y no se registra
					historial de partidas ni estadísticas. Para obtener un expediente
					permanente, regístrese con una cuenta.
				</p>

				{/* Aviso de caducidad */}
				<div className={styles.guestWarning}>
					<span className={styles.guestWarningIcon}>⚠</span>
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
				<button className={sharedStyles.actionBtnLogout} onClick={onLogout}>
					Cerrar sesión
				</button>
			</div>
		</div>
	);
}
