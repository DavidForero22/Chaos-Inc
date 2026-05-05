import { useState } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import { useAuth } from "../../hooks/useAuth";
import styles from "./ProfileActions.module.css";
import sharedStyles from "./Profile.module.css";

interface ProfileActionsProps {
	onLogout: () => void;
	onDeleteAccount: () => void;
}

export default function ProfileActions({
	onLogout,
	onDeleteAccount,
}: ProfileActionsProps) {
	const { provider } = useAuthStore();
	const { syncProviderAvatar } = useAuth();
	const [confirmDelete, setConfirmDelete] = useState(false);
	const [isSyncing, setIsSyncing] = useState(false);

	const handleSyncProviderAvatar = async () => {
		setIsSyncing(true);
		try {
			await syncProviderAvatar();
		} finally {
			setIsSyncing(false);
		}
	};

	return (
		<div className={styles.section}>
			<p className={styles.sectionLabel}>Gestión de Cuenta</p>

			{/* BOTÓN DE SINCRONIZACIÓN */}
			{provider && (
				<button
					className={`${styles.actionBtn} ${styles.actionBtnSync}`}
					onClick={handleSyncProviderAvatar}
					disabled={isSyncing}
				>
					{isSyncing
						? "⏳ Sincronizando..."
						: `🔄 Usar avatar de ${provider === "discord" ? "Discord" : "Google"}`}
				</button>
			)}

			<button
				className={`${styles.actionBtn} ${sharedStyles.actionBtnLogout}`}
				onClick={onLogout}
			>
				Cerrar sesión
			</button>

			{!confirmDelete ? (
				<button
					className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
					onClick={() => setConfirmDelete(true)}
				>
					Borrar Cuenta
				</button>
			) : (
				<div className={styles.deleteConfirm}>
					<p className={styles.deleteConfirmText}>
						Esta acción es irreversible. La cuenta será eliminada
						permanentemente.
					</p>
					<div className={styles.deleteConfirmBtns}>
						<button
							className={styles.confirmCancel}
							onClick={() => setConfirmDelete(false)}
						>
							Cancelar
						</button>
						<button className={styles.confirmDelete} onClick={onDeleteAccount}>
							Confirmar
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
