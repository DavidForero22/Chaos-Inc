// src/components/profile/UserInfo.tsx

import { useState, useMemo, useRef } from "react";
import type { ChangeEvent } from "react";
import { useAuth } from "../../hooks/useAuth";
import ProfileActions from "./ProfileActions";
import styles from "./UserInfo.module.css";

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
	notMyProfile: boolean;
	displayUser?: string | null;
	displayRole?: string | null;
	displayJoinedAt?: string | null;
	avatar?: string | null;
	providerAvatar?: string | null;
	provider?: string | null;
	onLogout?: () => void;
	onDeleteAccount?: () => void;
}

export default function UserInfo({
	notMyProfile,
	displayUser,
	displayRole,
	displayJoinedAt,
	avatar,
	providerAvatar,
	provider,
	onLogout,
	onDeleteAccount,
}: UserInfoProps) {
	const { uploadAvatar } = useAuth();
	const [isUploading, setIsUploading] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const roleConfig =
		ACCOUNT_ROLE_CONFIG[displayRole ?? "user"] ?? ACCOUNT_ROLE_CONFIG.user;

	const handleAvatarClick = () => {
		if (notMyProfile) return;
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

	const initials = displayUser
		? displayUser.substring(0, 2).toUpperCase()
		: "??";
	const rawAvatar = notMyProfile ? null : avatar || providerAvatar;

	const avatarUrl = useMemo(() => {
		if (!rawAvatar) return null;
		if (rawAvatar.startsWith("http")) return rawAvatar;
		const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
		return `${backendUrl}/storage/${rawAvatar}`;
	}, [rawAvatar]);

	return (
		<>
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
								alt={`Foto de ${displayUser}`}
								className={styles.avatarImage}
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

						{!notMyProfile && (
							<div className={styles.formGroup}>
								<label>ORIGEN DE REGISTRO:</label>
								<div className={styles.providerContainer}>
									{provider === "discord" ? (
										<span
											className={`${styles.providerBadge} ${styles.badgeDiscord}`}
										>
											DISCORD
										</span>
									) : provider === "google" ? (
										<span
											className={`${styles.providerBadge} ${styles.badgeGoogle}`}
										>
											GOOGLE
										</span>
									) : (
										<span
											className={`${styles.providerBadge} ${styles.badgeInternal}`}
										>
											CONTRATACIÓN INTERNA
										</span>
									)}
								</div>
							</div>
						)}
					</div>

					<div className={styles.formGroupInline}>
						<label>FECHA DE REGISTRO:</label>
						<strong>
							{displayJoinedAt
								? new Date(displayJoinedAt).toLocaleDateString("es-ES")
								: "REGISTRO EXTRAVIADO"}
						</strong>
					</div>
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

			{!notMyProfile && onLogout && onDeleteAccount && (
				<>
					<div className={styles.divider} />
					<ProfileActions
						onLogout={onLogout}
						onDeleteAccount={onDeleteAccount}
					/>
				</>
			)}
		</>
	);
}
