// src/components/profile/ProfileActions.tsx

import { useState } from "react";
import styles from "./ProfileActions.module.css";
import viewStyles from "./RegisteredProfileView.module.css";

interface ProfileActionsProps {
	onLogout: () => void;
	onDeleteAccount: () => void;
}

export default function ProfileActions({
	onLogout,
	onDeleteAccount,
}: ProfileActionsProps) {
	const [confirmDelete, setConfirmDelete] = useState(false);


	return (
		<div className={styles.section}>
			<h2 className={viewStyles.sectionLabel}>ACCIONES DISPONIBLES</h2>

			<div className={styles.actionsGrid}>
				{/* ── BOTÓN DE CERRAR SESIÓN ── */}
				<button
					className={`${styles.actionBtn} ${styles.actionBtnLogout}`}
					onClick={onLogout}
				>
					CERRAR SESIÓN
				</button>

				{/* ── BOTÓN DE BORRAR CUENTA ── */}
				{!confirmDelete ? (
					<button
						className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
						onClick={() => setConfirmDelete(true)}
					>
						BORRAR CUENTA
					</button>
				) : (
					<div className={`${styles.warningBox} ${styles.criticalWarning}`}>
						<p className={styles.warningText}>
							<strong>ALERTA DE PURGA DE DATOS:</strong> Esta acción es
							irreversible. Todos los registros, beneficios y estadísticas del
							sujeto serán eliminados de los servidores de Chaos Inc.
						</p>
						<div className={styles.confirmBtns}>
							<button
								className={styles.btnCancel}
								onClick={() => setConfirmDelete(false)}
							>
								CANCELAR
							</button>
							<button
								className={styles.btnConfirmDelete}
								onClick={onDeleteAccount}
							>
								CONFIRMAR
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
