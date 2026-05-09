// src/components/profile/ProfileActions.tsx

import { useState } from "react";
import styles from "./ProfileActions.module.css";
import viewStyles from "./RegisteredProfileView.module.css";
import EditProfileModal from "./EditProfileModal";
import type { UserRecord } from "../../types/api";

interface ProfileActionsProps {
	user?: UserRecord | null;
	onLogout: () => void;
	onDeleteAccount: () => void;
	onUpdateProfile: (data: any) => Promise<void>;
}

export default function ProfileActions({
	user,
	onLogout,
	onDeleteAccount,
	onUpdateProfile,
}: ProfileActionsProps) {
	const [confirmDelete, setConfirmDelete] = useState(false);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [isUpdating, setIsUpdating] = useState(false);

	const handleUpdateProfile = async (data: any) => {
		setIsUpdating(true);
		try {
			await onUpdateProfile(data);
			setIsEditModalOpen(false);
		} finally {
			setIsUpdating(false);
		}
	};

	return (
		<div className={styles.section}>
			<h2 className={viewStyles.sectionLabel}>ACCIONES DISPONIBLES</h2>

			<div className={styles.actionsGrid}>
				{/* ── BOTÓN DE EDITAR PERFIL ── */}
				<button
					className={`${styles.actionBtn} ${styles.actionBtnEdit}`}
					onClick={() => setIsEditModalOpen(true)}
				>
					EDITAR PERFIL
				</button>

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

			{/* ── RENDER DEL MODAL ── */}
			{isEditModalOpen && user && (
				<EditProfileModal
					user={user}
					onClose={() => setIsEditModalOpen(false)}
					onSubmit={handleUpdateProfile}
					isLoading={isUpdating}
				/>
			)}
		</div>
	);
}
