// src/components/profile/RegisteredProfileView.tsx

import { useState, useMemo, useRef } from "react";
import type { ChangeEvent } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import { useAuth } from "../../hooks/useAuth";
import type { GameRecord } from "../../types/api";

import styles from "./RegisteredProfileView.module.css";

import GraphsProfile from "./GraphsProfile.tsx";
import GameHistory from "./GameHistory.tsx";
import ProfileActions from "./ProfileActions.tsx";

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
	const { uploadAvatar } = useAuth();
	const [isUploading, setIsUploading] = useState(false);

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
			<ProfileActions onLogout={onLogout} onDeleteAccount={onDeleteAccount} />
		</div>
	);
}
