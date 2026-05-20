// src/components/profile/AvatarPolaroid.tsx
import { useRef } from "react";
import { useAuthStore } from "../../../store/auth/useAuthStore";
import { useProfileStore } from "../../../store/profile/useProfileStore";
import styles from "./UserInfo.module.css";

export default function AvatarPolaroid() {
	// ── Store del perfil ──
	const notMyProfile = useProfileStore((s) => s.notMyProfile);
	const isUploading = useProfileStore((s) => s.isUploading);
	const userRecord = useProfileStore((s) => s.userRecord);
	const handleAvatarClick = useProfileStore((s) => s.handleAvatarClick);
	const handleFileChange = useProfileStore((s) => s.handleFileChange);

	// ── Auth store ──
	const { user: myUser, avatar: myAvatar } = useAuthStore();

	// ── Datos derivados ──
	const displayUser = notMyProfile ? userRecord?.username : myUser;
	const displayAvatar = notMyProfile ? userRecord?.avatar : myAvatar;
	const avatarUrl = displayAvatar || null;
	const initials = displayUser ? displayUser.charAt(0).toUpperCase() : "?";

	// ── Referencia para el input file ──
	const fileInputRef = useRef<HTMLInputElement>(null);

	return (
		<div className={styles.photoAttachment}>
			<div className={styles.clip} aria-hidden="true" />
			<div
				className={styles.avatarContainer}
				onClick={handleAvatarClick}
				onKeyDown={(e) => {
					if (!notMyProfile && (e.key === "Enter" || e.key === " ")) {
						e.preventDefault();
						handleAvatarClick();
					}
				}}
				role={!notMyProfile ? "button" : undefined}
				tabIndex={!notMyProfile ? 0 : undefined}
				aria-label={
					!notMyProfile
						? "Actualizar foto de avatar"
						: `Avatar de ${displayUser}`
				}
				title={
					!notMyProfile
						? "Actualizar foto de avatar"
						: `Avatar de ${displayUser}`
				}
				style={notMyProfile ? { cursor: "default" } : undefined}
			>
				{isUploading ? (
					<div
						className={styles.avatarFallback}
						aria-label="Cargando avatar"
						role="status"
					>
						⏳
					</div>
				) : avatarUrl ? (
					<img
						src={avatarUrl}
						alt={`Avatar de ${displayUser}`}
						className={styles.avatarImage}
						referrerPolicy="no-referrer"
					/>
				) : (
					<div
						className={styles.avatarFallback}
						aria-label={`Avatar iniciales ${initials}`}
					>
						{initials}
					</div>
				)}
				{!notMyProfile && (
					<div className={styles.avatarOverlay} aria-hidden="true">
						ACTUALIZAR
						<br />
						FOTO
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
					aria-hidden="true"
					tabIndex={-1}
				/>
			)}
		</div>
	);
}
