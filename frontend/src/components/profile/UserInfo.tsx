// src/components/profile/UserInfo.tsx

import { useState, useMemo, useRef } from "react";
import type { ChangeEvent } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useAuthStore } from "../../store/useAuthStore";
import api from "../../api/axios";
import ProfileActions from "./ProfileActions";
import ProfileAchievements from "./ProfileAchievements";
import ModalLayout from "../ui/ModalLayout";
import type { UserAchievement, SocialAccountInfo } from "../../types/api";
import styles from "./UserInfo.module.css";
import viewStyles from "./RegisteredProfileView.module.css";

const ACCOUNT_ROLE_CONFIG: Record<
	string,
	{ label: string; badgeClass: string }
> = {
	admin: {
		label: "ADMINISTRADOR (NIVEL 5)",
		badgeClass: styles.roleAdmin,
	},
	user: {
		label: "EMPLEADO ESTÁNDAR (NIVEL 1)",
		badgeClass: styles.roleUser,
	},
};

interface UserInfoProps {
	userId?: number | null;
	notMyProfile: boolean;
	displayUser?: string | null;
	displayRole?: string | null;
	displayJoinedAt?: string | null;
	avatar?: string | null;
	socialAccounts?: SocialAccountInfo[] | null;
	achievements?: UserAchievement[];
	onLogout?: () => void;
	onDeleteAccount?: () => void;
}

export default function UserInfo({
	userId,
	notMyProfile,
	displayUser,
	displayRole,
	displayJoinedAt,
	avatar,
	socialAccounts,
	achievements,
	onLogout,
	onDeleteAccount,
}: UserInfoProps) {
	const { uploadAvatar } = useAuth();
	const [isUploading, setIsUploading] = useState(false);
	const [showAvatarModal, setShowAvatarModal] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	
	const roleConfig =
		ACCOUNT_ROLE_CONFIG[displayRole ?? "user"] ?? ACCOUNT_ROLE_CONFIG.user;

	// Calcular qué redes tiene vinculadas para encender/apagar los badges
	const isDiscordLinked = socialAccounts?.some(
		(acc) => acc.provider === "discord",
	);
	const isGoogleLinked = socialAccounts?.some(
		(acc) => acc.provider === "google",
	);

	const handleAvatarClick = () => {
		if (notMyProfile) return;

		// Si tiene cuentas vinculadas, abrir modal. Si no, directo a subir foto.
		if (socialAccounts && socialAccounts.length > 0) {
			setShowAvatarModal(true);
		} else {
			fileInputRef.current?.click();
		}
	};

	const handleManualUploadClick = (e: React.FormEvent) => {
		e.preventDefault();
		setShowAvatarModal(false);
		fileInputRef.current?.click();
	};

	const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setIsUploading(true);
		await uploadAvatar(file);
		setIsUploading(false);
		if (e.target) e.target.value = "";
	};

	const handleSelectProviderAvatar = async (
		providerName: string,
		avatarUrl: string | null,
	) => {
		if (!userId) return;

		try {
			setIsUploading(true);
			setShowAvatarModal(false); // Cerrar el modal mientras carga para dar feedback visual en la polaroid

			await api.post(`/users/${userId}/avatar`, { provider: providerName });

			if (!notMyProfile) {
				useAuthStore.getState().setAvatar(avatarUrl);
			}
		} catch (error) {
			console.error("Error al actualizar avatar de proveedor:", error);
		} finally {
			setIsUploading(false);
		}
	};

	const initials = displayUser
		? displayUser.substring(0, 2).toUpperCase()
		: "??";

	const rawAvatar = avatar;

	const avatarUrl = useMemo(() => {
		if (!rawAvatar) return null;
		if (rawAvatar.startsWith("http")) return rawAvatar;
		const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
		return `${backendUrl}/storage/${rawAvatar}`;
	}, [rawAvatar]);

	return (
		<>
			<h1 className={viewStyles.sectionTitle}>INFORMACIÓN DEL USUARIO</h1>
			<div className={styles.header}>
				{/* ── FOTO TIPO POLAROID ── */}
				<div className={styles.photoAttachment}>
					<div className={styles.clip} />
					<div
						className={styles.avatarContainer}
						onClick={handleAvatarClick}
						title={
							notMyProfile ? (displayUser ?? "") : "Actualizar foto de avatar"
						}
						style={notMyProfile ? { cursor: "default" } : undefined}
					>
						{isUploading ? (
							<div className={styles.avatarFallback}>⏳</div>
						) : avatarUrl ? (
							<img
								src={avatarUrl}
								alt={`Avatar de ${displayUser}`}
								className={styles.avatarImage}
								referrerPolicy="no-referrer"
							/>
						) : (
							<div className={styles.avatarFallback}>{initials}</div>
						)}
						{!notMyProfile && (
							<div className={styles.avatarOverlay}>
								ACTUALIZAR
								<br />
								FOTO
							</div>
						)}
					</div>
				</div>

				{/* ── DATOS DEL EMPLEADO ── */}
				<div className={styles.employeeData}>
					<div className={styles.formGroup}>
						<label>NOMBRE DEL SUJETO:</label>
						<div className={styles.formValue}>
							<h1 className={styles.employeeName}>{displayUser}</h1>
						</div>
					</div>

					<div className={styles.formRow}>
						<div className={styles.formGroup}>
							<label>NIVEL DEL EMPLEADO:</label>
							<div className={`${styles.roleBadge} ${roleConfig.badgeClass}`}>
								{roleConfig.label}
							</div>
						</div>

					</div>

					<div className={styles.formGroupInline}>
						<label>FECHA DE REGISTRO:</label>
						<strong>
							{displayJoinedAt
								? new Date(displayJoinedAt).toLocaleDateString("es-ES")
								: "REGISTRO DESCONOCIDO"}
						</strong>
					</div>

					{/* ── CUENTAS VINCULADAS ── */}
					{!notMyProfile && (
						<div className={styles.linkedAccountsSection}>
							<label>CUENTAS VINCULADAS:</label>
							<div className={styles.providerContainer}>
								<span
									className={`${styles.providerBadge} ${styles.badgeDiscord} ${!isDiscordLinked ? styles.badgeUnlinked : ""}`}
									title={
										isDiscordLinked
											? "Cuenta de Discord vinculada"
											: "Discord no vinculado"
									}
								>
									DISCORD
								</span>
								<span
									className={`${styles.providerBadge} ${styles.badgeGoogle} ${!isGoogleLinked ? styles.badgeUnlinked : ""}`}
									title={
										isGoogleLinked
											? "Cuenta de Google vinculada"
											: "Google no vinculado"
									}
								>
									GOOGLE
								</span>
							</div>
						</div>
					)}
				</div>

				{!notMyProfile && (
					<input
						type="file"
						ref={fileInputRef}
						style={{ display: "none" }}
						accept="image/jpeg, image/png, image/webp"
						onChange={handleFileChange}
					/>
				)}
			</div>

			{/* ── SECCIÓN DE LOGROS ── */}
			<div className={styles.divider} />
			<ProfileAchievements userAchievements={achievements} />

			{/* ── ACCIONES DEL PERFIL PROPIO ── */}
			{!notMyProfile && onLogout && onDeleteAccount && (
				<>
					<div className={styles.divider} />
					<ProfileActions
						onLogout={onLogout}
						onDeleteAccount={onDeleteAccount}
					/>
				</>
			)}

			{/* ── MODAL DE SELECCIÓN DE AVATAR ── */}
			{showAvatarModal && (
				<ModalLayout
					title="ACTUALIZAR AVATAR"
					subtitle="Elige tu foto corporativa"
					onClose={() => setShowAvatarModal(false)}
					onSubmit={handleManualUploadClick}
					submitText="Subir foto manual"
				>
					<div className="flex flex-col gap-3 py-2">
						<p className="text-sm font-bold text-gray-600 mb-2 font-mono">
							Opciones disponibles:
						</p>

						{socialAccounts?.map((acc) => (
							<button
								key={acc.provider}
								type="button"
								onClick={() =>
									handleSelectProviderAvatar(acc.provider, acc.avatar)
								}
								className={`w-full py-3 px-4 font-black text-white text-sm uppercase tracking-wider rounded border flex justify-center items-center gap-2 transition-transform hover:scale-[1.02] ${
									acc.provider === "discord"
										? "bg-[#5865f2] border-[#4752c4]"
										: "bg-[#db4437] border-[#b0362c]"
								}`}
							>
								Usar avatar de {acc.provider}
							</button>
						))}
					</div>
				</ModalLayout>
			)}
		</>
	);
}
