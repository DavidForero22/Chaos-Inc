// src/components/profile/ProfileActions.tsx
// Accesibilidad comprobada: SI

import { useState, useEffect, useRef } from "react";
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

	// Referencias para gestión de foco
	const confirmDeleteButtonRef = useRef<HTMLButtonElement>(null);
	const cancelDeleteButtonRef = useRef<HTMLButtonElement>(null);
	const editButtonRef = useRef<HTMLButtonElement>(null);
	const warningBoxRef = useRef<HTMLDivElement>(null);

	// Enfocar el primer botón de confirmación cuando aparece el warning
	useEffect(() => {
		if (confirmDelete && cancelDeleteButtonRef.current) {
			cancelDeleteButtonRef.current.focus();
			// Anunciar a lectores de pantalla
			const announcement = document.createElement("div");
			announcement.setAttribute("role", "status");
			announcement.setAttribute("aria-live", "polite");
			announcement.className = "sr-only";
			announcement.textContent =
				"Advertencia: Estás a punto de borrar tu cuenta. Esta acción es irreversible. Usa los botones para cancelar o confirmar.";
			document.body.appendChild(announcement);
			setTimeout(() => announcement.remove(), 3000);
		}
	}, [confirmDelete]);

	const handleUpdateProfile = async (data: any) => {
		setIsUpdating(true);
		try {
			await onUpdateProfile(data);
			setIsEditModalOpen(false);
			// Anunciar éxito
			const announcement = document.createElement("div");
			announcement.setAttribute("role", "status");
			announcement.setAttribute("aria-live", "polite");
			announcement.className = "sr-only";
			announcement.textContent = "Perfil actualizado correctamente";
			document.body.appendChild(announcement);
			setTimeout(() => announcement.remove(), 3000);
		} finally {
			setIsUpdating(false);
		}
	};

	const handleLogout = () => {
		// Anunciar antes de cerrar sesión
		const announcement = document.createElement("div");
		announcement.setAttribute("role", "status");
		announcement.setAttribute("aria-live", "polite");
		announcement.className = "sr-only";
		announcement.textContent = "Cerrando sesión";
		document.body.appendChild(announcement);
		setTimeout(() => announcement.remove(), 1000);
		onLogout();
	};

	const handleDeleteAccount = () => {
		// Anunciar antes de borrar cuenta
		const announcement = document.createElement("div");
		announcement.setAttribute("role", "alert");
		announcement.setAttribute("aria-live", "assertive");
		announcement.className = "sr-only";
		announcement.textContent =
			"Tu cuenta está siendo eliminada. Esta acción es irreversible.";
		document.body.appendChild(announcement);
		setTimeout(() => announcement.remove(), 2000);
		onDeleteAccount();
	};

	const handleKeyDownOnWarning = (e: React.KeyboardEvent) => {
		if (e.key === "Escape") {
			setConfirmDelete(false);
			// Devolver foco al botón de borrar cuenta
			const deleteButton = document.querySelector(`.${styles.actionBtnDelete}`);
			if (deleteButton instanceof HTMLButtonElement) {
				deleteButton.focus();
			}
		}
	};

	return (
		<section className={styles.section} aria-labelledby="actions-heading">
			<h2 id="actions-heading" className={viewStyles.sectionLabel}>
				ACCIONES DISPONIBLES
			</h2>

			<div
				className={styles.actionsGrid}
				role="group"
				aria-label="Acciones de perfil"
			>
				{/* ── BOTÓN DE EDITAR PERFIL ── */}
				<button
					ref={editButtonRef}
					className={`${styles.actionBtn} ${styles.actionBtnEdit}`}
					onClick={() => setIsEditModalOpen(true)}
					aria-label="Editar información del perfil"
					aria-haspopup="dialog"
				>
					EDITAR PERFIL
				</button>

				{/* ── BOTÓN DE CERRAR SESIÓN ── */}
				<button
					className={`${styles.actionBtn} ${styles.actionBtnLogout}`}
					onClick={handleLogout}
					aria-label="Cerrar sesión de tu cuenta"
				>
					CERRAR SESIÓN
				</button>

				{/* ── BOTÓN DE BORRAR CUENTA ── */}
				{!confirmDelete ? (
					<button
						className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
						onClick={() => setConfirmDelete(true)}
						aria-label="Borrar cuenta permanentemente - Acción irreversible"
					>
						BORRAR CUENTA
					</button>
				) : (
					<div
						ref={warningBoxRef}
						className={`${styles.warningBox} ${styles.criticalWarning}`}
						role="alertdialog"
						aria-labelledby="warning-title"
						aria-describedby="warning-description"
						aria-modal="true"
						onKeyDown={handleKeyDownOnWarning}
					>
						<p id="warning-title" className={styles.warningText}>
							<strong>⚠️ ALERTA DE PURGA DE DATOS:</strong>
						</p>
						<p id="warning-description" className={styles.warningText}>
							Esta acción es <strong>irreversible</strong>. Todos los registros,
							beneficios y estadísticas del sujeto serán eliminados de los
							servidores de Chaos Inc.
						</p>
						<div
							className={styles.confirmBtns}
							role="group"
							aria-label="Opciones de confirmación"
						>
							<button
								ref={cancelDeleteButtonRef}
								className={styles.btnCancel}
								onClick={() => setConfirmDelete(false)}
								aria-label="Cancelar eliminación de cuenta"
							>
								CANCELAR
							</button>
							<button
								ref={confirmDeleteButtonRef}
								className={styles.btnConfirmDelete}
								onClick={handleDeleteAccount}
								aria-label="Confirmar eliminación permanente de cuenta"
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
		</section>
	);
}
