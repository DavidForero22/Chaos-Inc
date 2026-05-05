// src/components/profile/RegisteredProfileView.tsx

import { useState, useMemo, useRef } from "react";
import type { ChangeEvent } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import { useAuth } from "../../hooks/useAuth";
import type { GameRecord } from "../../types/api";

import styles from "./RegisteredProfileView.module.css";
import sharedStyles from "./Profile.module.css";

import GraphsProfile from "./GraphsProfile.tsx";
import GameHistory from "./GameHistory.tsx";


const ACCOUNT_ROLE_CONFIG: Record<
	string,
	{
		label: string;
		badgeClass: string;
		dotClass: string;
	}
> = {
	admin: {
		label: "Administrador",
		badgeClass: styles.roleAdmin,
		dotClass: styles.roleAdminDot,
	},
	user: {
		label: "Usuario",
		badgeClass: styles.roleUser,
		dotClass: styles.roleUserDot,
	},
};

interface RegisteredProfileViewProps {
	games: GameRecord[];
	onLogout: () => void;
	onDeleteAccount: () => void;
}

export default function RegisteredProfileView({
	games,
	onLogout,
	onDeleteAccount,
}: RegisteredProfileViewProps) {
	const { user, role, avatar, provider, providerAvatar } = useAuthStore();
	const { uploadAvatar, syncProviderAvatar } = useAuth();
	const [confirmDelete, setConfirmDelete] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const [isSyncing, setIsSyncing] = useState(false);

	const roleConfig =
		ACCOUNT_ROLE_CONFIG[role ?? "user"] ?? ACCOUNT_ROLE_CONFIG.user;

	const fileInputRef = useRef<HTMLInputElement>(null);

	// --- Lógica del Avatar ---
	const handleAvatarClick = () => {
		fileInputRef.current?.click();
	};

	const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		setIsUploading(true);
		await uploadAvatar(file);
		setIsUploading(false);

		// Reseteamos el input por si quiere volver a subir la misma foto
		if (e.target) e.target.value = "";
	};

	const handleSyncProviderAvatar = async () => {
		setIsSyncing(true);
		await syncProviderAvatar();
		setIsSyncing(false);
	};

	// Obtener iniciales (ej: "Usuario123" -> "US")
	const initials = user ? user.substring(0, 2).toUpperCase() : "??";
	const displayAvatar = avatar || providerAvatar;

	// Procesar la URL del avatar (si es de Discord/Google empieza por http, si es local añadimos la URL del backend)
	const avatarUrl = useMemo(() => {
		if (!displayAvatar) return null;
		if (displayAvatar.startsWith("http")) return displayAvatar;
		const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
		return `${backendUrl}/storage/${displayAvatar}`;
	}, [displayAvatar]);

	return (
		<div className={styles.dossier}>
			{/* ── CABECERA ── */}
			<div className={styles.header}>
				<div className={styles.headerLeft}>
					{/* Contenedor del Avatar */}
					<div
						className={styles.avatarContainer}
						onClick={handleAvatarClick}
						title="Cambiar fotografía"
					>
						{isUploading ? (
							<div className={styles.avatarFallback}>⏳</div>
						) : avatarUrl ? (
							<img
								src={avatarUrl}
								alt={`Avatar de ${user}`}
								className={styles.avatarImage}
							/>
						) : (
							<div className={styles.avatarFallback}>{initials}</div>
						)}
						<div className={styles.avatarOverlay}>📷</div>
					</div>

					{/* Input oculto */}
					<input
						type="file"
						ref={fileInputRef}
						style={{ display: "none" }}
						accept="image/jpeg, image/png, image/webp"
						onChange={handleFileChange}
					/>

					{/* Textos de la cabecera */}
					<div className={styles.headerText}>
						<div className={styles.nameRow}>
							<h1 className={styles.employeeName}>{user}</h1>

							{/* 2. ETIQUETA CONDICIONAL DEL PROVIDER */}
							{provider === "discord" && (
								<span
									className={`${styles.providerBadge} ${styles.badgeDiscord}`}
								>
									Discord
								</span>
							)}
							{provider === "google" && (
								<span
									className={`${styles.providerBadge} ${styles.badgeGoogle}`}
								>
									Google
								</span>
							)}
						</div>

						<p className={styles.headerMeta}>
							{games.length} partidas en el registro
						</p>
					</div>
				</div>

				{/* Badge de rol de cuenta */}
				<div className={`${styles.roleBadge} ${roleConfig.badgeClass}`}>
					<span className={`${styles.roleDot} ${roleConfig.dotClass}`} />
					{roleConfig.label}
				</div>
			</div>

			{/* ── ESTADÍSTICAS GLOBALES ── */}
			<GraphsProfile games={games} user={user} />

			{/* ── HISTORIAL ── */}
			<GameHistory games={games} user={user} />

			{/* ── ACCIONES ── */}
			<div className={styles.section}>
				<p className={styles.sectionLabel}>Gestión de Cuenta</p>

				{/* BOTÓN DE SINCRONIZACIÓN */}
				{/* Solo se muestra si inició sesión con un provider Y además tiene subido un avatar manual */}
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
							<button
								className={styles.confirmDelete}
								onClick={onDeleteAccount}
							>
								Confirmar
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
