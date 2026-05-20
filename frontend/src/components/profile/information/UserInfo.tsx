// src/components/profile/UserInfo.tsx
// Accesibilidad comprobada: SI

import { useEffect } from "react";
import { useAuthStore } from "../../../store/auth/useAuthStore";
import { useProfileStore } from "../../../store/profile/useProfileStore.tsx";
import ProfileActions from "./ProfileActions";
import ProfileAchievements from "./ProfileAchievements";
import AvatarPolaroid from "./AvatarPolaroid";
import UserNameAndActions from "./UserNameAndActions";
import LinkedAccounts from "./LinkedAccounts";
import ProfileModals from "./ProfileModals";
import LevelProgressBar from "./LevelProgressBar";
import FriendList from "./FriendList";
import styles from "./UserInfo.module.css";
import viewStyles from "../RegisteredProfileView.module.css";

export default function UserInfo() {
	// ── Store del perfil ──
	const notMyProfile = useProfileStore((s) => s.notMyProfile);
	const userRecord = useProfileStore((s) => s.userRecord);

	// ── Auth store ──
	const {
		user: myUser,
		socialAccounts: mySocialAccounts,
		joinedAt: myJoinedAt,
	} = useAuthStore();

	// ── Datos derivados ──
	const displayUser = notMyProfile ? userRecord?.username : myUser;
	const displayJoinedAt = notMyProfile
		? userRecord?.joinedAt
		: (userRecord?.joinedAt ?? myJoinedAt);
	const isActuallyMe = !notMyProfile;
	const displaySocialAccounts = isActuallyMe
		? userRecord?.socialAccounts || mySocialAccounts
		: null;

	// Detectar proveedores vinculados
	const socialAccountsArray = displaySocialAccounts || [];
	const isDiscordLinked = socialAccountsArray.some(
		(acc) => acc.provider === "discord",
	);
	const isGoogleLinked = socialAccountsArray.some(
		(acc) => acc.provider === "google",
	);

	// ── Acciones del store ──
	const handleProviderClick = useProfileStore((s) => s.handleProviderClick);
	const onLogout = useProfileStore((s) => s.onLogout);
	const onDeleteAccount = useProfileStore((s) => s.onDeleteAccount);
	const onUpdateProfile = useProfileStore((s) => s.onUpdateProfile);

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
				<AvatarPolaroid />

				<UserNameAndActions />
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
			<ProfileAchievements userAchievements={userRecord?.achievements || []} />

			{/* ── SECCIÓN DE AMIGOS ── */}
			<div className={styles.divider} />
			<FriendList friends={userRecord?.friends || []} />

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
			<ProfileModals />
		</>
	);
}
