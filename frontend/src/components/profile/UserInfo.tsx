// src/components/profile/UserInfo.tsx

import ProfileActions from "./ProfileActions";
import ProfileAchievements from "./ProfileAchievements";
import ModalLayout from "../ui/ModalLayout";
import { useUserInfo } from "../../hooks/profile/useUserInfo";
import type {
	UserAchievement,
	SocialAccountInfo,
	UserRecord,
} from "../../types/api";
import styles from "./UserInfo.module.css";
import viewStyles from "./RegisteredProfileView.module.css";

const ACCOUNT_ROLE_CONFIG: Record<
	string,
	{ label: string; badgeClass: string }
> = {
	admin: { label: "ADMINISTRADOR (NIVEL 5)", badgeClass: styles.roleAdmin },
	user: { label: "EMPLEADO ESTÁNDAR (NIVEL 1)", badgeClass: styles.roleUser },
};

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

	const roleConfig =
		ACCOUNT_ROLE_CONFIG[displayRole ?? "user"] ?? ACCOUNT_ROLE_CONFIG.user;

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
								<button
									type="button"
									onClick={() =>
										handleProviderClick("discord", isDiscordLinked)
									}
									className={`${styles.providerBadge} ${styles.badgeDiscord} ${!isDiscordLinked ? styles.badgeUnlinked : ""} transition-transform hover:scale-105`}
									title={
										isDiscordLinked
											? "Desvincular Discord"
											: "Conectar con Discord"
									}
								>
									DISCORD
								</button>
								<button
									type="button"
									onClick={() => handleProviderClick("google", isGoogleLinked)}
									className={`${styles.providerBadge} ${styles.badgeGoogle} ${!isGoogleLinked ? styles.badgeUnlinked : ""} transition-transform hover:scale-105`}
									title={
										isGoogleLinked
											? "Desvincular Google"
											: "Conectar con Google"
									}
								>
									GOOGLE
								</button>
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

			{/* ── MODAL DE DESVINCULACIÓN ── */}
			{showUnlinkModal && (
				<ModalLayout
					title="DESVINCULAR CUENTA"
					subtitle={`¿Seguro que quieres quitar ${providerToUnlink?.toUpperCase()}?`}
					onClose={() => setShowUnlinkModal(false)}
					onSubmit={confirmUnlink}
					isLoading={isUnlinking}
					submitText="Desvincular"
					loadingText="Procesando..."
				>
					<div className="py-2 text-center text-sm font-mono text-gray-700">
						<p>
							Si desvinculas esta cuenta, ya no podrás iniciar sesión usándola.
						</p>
						<p className="mt-2 text-red-600 font-bold">
							Nota: Si tienes la foto de este proveedor como tu avatar
							principal, se quitará de tu perfil.
						</p>
					</div>
				</ModalLayout>
			)}
			{/* ── FORZAR CONTRASEÑA DE SEGURIDAD ── */}
			{showForcePasswordModal && (
				<ModalLayout
					title="ACCIÓN REQUERIDA"
					subtitle="Establece una contraseña de seguridad"
					onClose={closeForcePasswordModal}
					onSubmit={confirmUnlink}
					isLoading={isUnlinking}
					submitText="Guardar y Desvincular"
					loadingText="Procesando..."
				>
					<div className="flex flex-col gap-4 py-2">
						<div className={`border-2 border-[#d32f2f] bg-[#d32f2f]/10 p-3`}>
							<p className="text-sm font-bold text-[#b71c1c] text-justify font-mono leading-tight">
								ALERTA: Esta es tu última cuenta vinculada y no tienes una
								contraseña establecida. Si desvinculas{" "}
								{providerToUnlink?.toUpperCase()} ahora, perderás el acceso a
								esta cuenta.
							</p>
						</div>

						<div className={styles.formGroup}>
							<label className={styles.label}>NUEVA CONTRASEÑA</label>
							<input
								type="password"
								className={`${styles.input} ${unlinkPasswordError ? "border-[#d32f2f]" : ""}`}
								value={unlinkPassword}
								onChange={(e) => setUnlinkPassword(e.target.value)}
								placeholder="Mínimo 8 caracteres"
								required
								minLength={8}
							/>
							{unlinkPasswordError && (
								<p className="text-[#d32f2f] text-xs font-bold mt-1 font-mono">
									{unlinkPasswordError}
								</p>
							)}
						</div>
					</div>
				</ModalLayout>
			)}
		</>
	);
}
