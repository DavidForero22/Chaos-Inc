// src/components/profile/UserInfo.tsx
// Accesibilidad comprobada: SI

import ProfileActions from "./ProfileActions";
import ProfileAchievements from "./ProfileAchievements";
import AvatarPolaroid from "./AvatarPolaroid";
import UserNameAndActions from "./UserNameAndActions";
import LinkedAccounts from "./LinkedAccounts";
import ProfileModals from "./ProfileModals";
import { useUserInfo } from "../../../hooks/profile/useUserInfo";
import type {
	UserAchievement,
	SocialAccountInfo,
	UserRecord,
	FriendSummary,
} from "../../../types/user.ts";
import styles from "./UserInfo.module.css";
import viewStyles from "../RegisteredProfileView.module.css";
import { useEffect } from "react";
import LevelProgressBar from "./LevelProgressBar";
import FriendList from "./FriendList.tsx";

interface UserInfoProps {
	userId?: number | null;
	notMyProfile: boolean;
	userRecord?: UserRecord | null;
	displayUser?: string | null;
	displayRole?: string | null;
	displayJoinedAt?: string | null;
	avatar?: string | null;
	socialAccounts?: SocialAccountInfo[] | null;
	achievements?: UserAchievement[];
	friends?: FriendSummary[];
	onLogout?: () => void;
	onDeleteAccount?: () => void;
	onUpdateProfile?: (data: any) => Promise<void>;
}

export default function UserInfo({
	userId,
	notMyProfile,
	userRecord,
	displayUser,
	displayRole,
	displayJoinedAt,
	avatar,
	socialAccounts,
	achievements,
	friends,
	onLogout,
	onDeleteAccount,
	onUpdateProfile,
}: UserInfoProps) {
	const {
		isUploading,
		showAvatarModal,
		setShowAvatarModal,
		showUnlinkModal,
		setShowUnlinkModal,
		providerToUnlink,
		isUnlinking,
		fileInputRef,
		isDiscordLinked,
		isGoogleLinked,
		initials,
		avatarUrl,
		handleAvatarClick,
		handleManualUploadClick,
		handleFileChange,
		handleSelectProviderAvatar,
		handleProviderClick,
		confirmUnlink,
		showForcePasswordModal,
		closeForcePasswordModal,
		unlinkPassword,
		setUnlinkPassword,
		unlinkPasswordError,
	} = useUserInfo({
		userId,
		notMyProfile,
		displayUser,
		avatar,
		socialAccounts,
	});

	// Anunciar carga de información del usuario
	useEffect(() => {
		const announcement = document.createElement("div");
		announcement.setAttribute("role", "status");
		announcement.setAttribute("aria-live", "polite");
		announcement.className = "sr-only";
		announcement.textContent = `Información del usuario ${displayUser} cargada`;
		document.body.appendChild(announcement);
		setTimeout(() => announcement.remove(), 2000);
	}, [displayUser]);

	return (
		<>
			<h1 className={viewStyles.sectionTitle}>INFORMACIÓN DEL USUARIO</h1>
			<div className={styles.header}>
				{/* ── FOTO TIPO POLAROID ── */}
				<AvatarPolaroid
					notMyProfile={notMyProfile}
					isUploading={isUploading}
					avatarUrl={avatarUrl}
					initials={initials}
					displayUser={displayUser}
					onClick={handleAvatarClick}
					fileInputRef={fileInputRef}
					onFileChange={handleFileChange}
				/>

				{/* ── DATOS DEL EMPLEADO ── */}
				<UserNameAndActions
					displayUser={displayUser}
					displayRole={displayRole}
					notMyProfile={notMyProfile}
					onFriendRequest={() => {
						// TODO: implementar solicitud de amistad
					}}
					onGallery={() => {
						// TODO: implementar galería de desbloqueables
					}}
				/>
			</div>
			<div className="mt-8">
				<div className={styles.formGroup}>
					<label id="user-level-label">NIVEL DEL USUARIO:</label>
					<div aria-labelledby="user-level-label" className="mt-1">
						{userRecord && !userRecord.isGuest ? (
							<LevelProgressBar totalXp={userRecord.totalXp ?? 0} />
						) : (
							<p className="text-xs font-mono text-gray-500 italic">
								Crea una cuenta para guardar tu progreso
							</p>
						)}
					</div>
				</div>
			</div>
			<div className={styles.formRow}>
				<div className={styles.formGroup}>
					<label id="join-date-label">FECHA DE REGISTRO:</label>
					<strong aria-labelledby="join-date-label">
						{displayJoinedAt
							? new Date(displayJoinedAt).toLocaleDateString("es-ES")
							: "REGISTRO DESCONOCIDO"}
					</strong>
				</div>
			</div>
			{/* ── CUENTAS VINCULADAS ── */}
			{!notMyProfile && (
				<LinkedAccounts
					isDiscordLinked={isDiscordLinked}
					isGoogleLinked={isGoogleLinked}
					onProviderClick={handleProviderClick}
				/>
			)}
			{/* ── SECCIÓN DE LOGROS ── */}
			<div className={styles.divider} />
			<ProfileAchievements userAchievements={achievements} />
			{/* ── SECCIÓN DE AMIGOS ── */} {/* <- NUEVO BLOQUE */}
			<div className={styles.divider} />
			<FriendList friends={friends} />
			{/* ── ACCIONES DEL PERFIL PROPIO ── */}
			{!notMyProfile && onLogout && onDeleteAccount && onUpdateProfile && (
				<>
					<div className={styles.divider} />
					<ProfileActions
						user={userRecord}
						onLogout={onLogout}
						onDeleteAccount={onDeleteAccount}
						onUpdateProfile={onUpdateProfile}
					/>
				</>
			)}
			{/* ── MODALES ── */}
			<ProfileModals
				showAvatarModal={showAvatarModal}
				setShowAvatarModal={setShowAvatarModal}
				socialAccounts={socialAccounts}
				handleSelectProviderAvatar={handleSelectProviderAvatar}
				handleManualUploadClick={handleManualUploadClick}
				showUnlinkModal={showUnlinkModal}
				setShowUnlinkModal={setShowUnlinkModal}
				providerToUnlink={providerToUnlink}
				isUnlinking={isUnlinking}
				confirmUnlink={confirmUnlink}
				showForcePasswordModal={showForcePasswordModal}
				closeForcePasswordModal={closeForcePasswordModal}
				unlinkPassword={unlinkPassword}
				setUnlinkPassword={setUnlinkPassword}
				unlinkPasswordError={unlinkPasswordError}
			/>
		</>
	);
}
