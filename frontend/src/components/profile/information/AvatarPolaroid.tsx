// src/components/profile/AvatarPolaroid.tsx
import { type RefObject } from "react";
import styles from "./UserInfo.module.css";

interface AvatarPolaroidProps {
	notMyProfile: boolean;
	isUploading: boolean;
	avatarUrl: string | null;
	initials: string;
	displayUser?: string | null;
	onClick: () => void;
	fileInputRef: RefObject<HTMLInputElement | null>;
	onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function AvatarPolaroid({
	notMyProfile,
	isUploading,
	avatarUrl,
	initials,
	displayUser,
	onClick,
	fileInputRef,
	onFileChange,
}: AvatarPolaroidProps) {
	return (
		<div className={styles.photoAttachment}>
			<div className={styles.clip} aria-hidden="true" />
			<div
				className={styles.avatarContainer}
				onClick={onClick}
				onKeyDown={(e) => {
					if (!notMyProfile && (e.key === "Enter" || e.key === " ")) {
						e.preventDefault();
						onClick();
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
					onChange={onFileChange}
					aria-hidden="true"
					tabIndex={-1}
				/>
			)}
		</div>
	);
}
