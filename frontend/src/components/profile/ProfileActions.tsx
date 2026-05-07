// src/components/profile/ProfileActions.tsx

import { useState } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import { useAuth } from "../../hooks/useAuth";
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
	const { provider, avatar } = useAuthStore();
	const { syncProviderAvatar } = useAuth();

	const [confirmDelete, setConfirmDelete] = useState(false);
	const [confirmSync, setConfirmSync] = useState(false); 
	const [isSyncing, setIsSyncing] = useState(false);

	const handleSyncProviderAvatar = async () => {
		setIsSyncing(true);
		try {
			await syncProviderAvatar();
			setConfirmSync(false);
		} finally {
			setIsSyncing(false);
		}
	};

	const providerName = provider === "discord" ? "DISCORD" : "GOOGLE";

	return (
		<div className={styles.section}>
			<h2 className={viewStyles.sectionLabel}>
				ACCIONES DISPONIBLES
			</h2>

			<div className={styles.actionsGrid}>
				{/* ── BOTÓN DE SINCRONIZACIÓN / REASIGNACIÓN ── */}
				{provider &&
					(!confirmSync ? (
						<button
							className={`${styles.actionBtn} ${styles.actionBtnSync}`}
							// Si tiene avatar custom, pedir confirmación. Si no, sincronizar directo.
							onClick={() =>
								avatar ? setConfirmSync(true) : handleSyncProviderAvatar()
							}
							disabled={isSyncing}
						>
							{isSyncing
								? "CARGANDO..."
								: avatar
									? `USAR AVATAR ${providerName}`
									: `SINCRONIZAR AVATAR ${providerName}`}
						</button>
					) : (
						<div className={styles.warningBox}>
							<p className={styles.warningText}>
								<strong>AVISO DE DESTRUCCIÓN VISUAL:</strong> Al proceder, la
								fotografía manual anexa a este expediente será destruida de
								forma permanente. El sistema recuperará su identidad actual
								registrada en la base de datos de {providerName}. ¿Desea
								proceder?
							</p>
							<div className={styles.confirmBtns}>
								<button
									className={styles.btnCancel}
									onClick={() => setConfirmSync(false)}
								>
									CANCELAR
								</button>
								<button
									className={styles.btnConfirmSync}
									onClick={handleSyncProviderAvatar}
								>
									CONFIRMAR
								</button>
							</div>
						</div>
					))}

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
