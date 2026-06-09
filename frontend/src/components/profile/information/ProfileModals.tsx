// src/components/profile/ProfileModals.tsx
import { useRef, type FormEvent } from "react";
import { useAuthStore } from "../../../store/auth/useAuthStore";
import { useProfileStore } from "../../../store/profile/useProfileStore.tsx";
import ModalLayout from "../../ui/Modals/ModalLayout.tsx";
import FriendRequestsModal from "./FriendRequestsModal";
import styles from "./UserInfo.module.css";
import GalleryModal from "./gallery/GalleryModal.tsx";

export default function ProfileModals() {
	// ── Store del perfil ──
	const showAvatarModal = useProfileStore((s) => s.showAvatarModal);
	const setShowAvatarModal = useProfileStore((s) => s.setShowAvatarModal);
	const showUnlinkModal = useProfileStore((s) => s.showUnlinkModal);
	const setShowUnlinkModal = useProfileStore((s) => s.setShowUnlinkModal);
	const providerToUnlink = useProfileStore((s) => s.providerToUnlink);
	const showForcePasswordModal = useProfileStore(
		(s) => s.showForcePasswordModal,
	);
	const unlinkPassword = useProfileStore((s) => s.unlinkPassword);
	const unlinkPasswordError = useProfileStore((s) => s.unlinkPasswordError);
	const showFriendRequestsModal = useProfileStore(
		(s) => s.showFriendRequestsModal,
	);
	const setShowFriendRequestsModal = useProfileStore(
		(s) => s.setShowFriendRequestsModal,
	);
	const pendingReceived = useProfileStore((s) => s.pendingReceived);
	const pendingSent = useProfileStore((s) => s.pendingSent);
	const friendsLoading = useProfileStore((s) => s.friendsLoading);
	const showRemoveFriendModal = useProfileStore((s) => s.showRemoveFriendModal);
	const setShowRemoveFriendModal = useProfileStore(
		(s) => s.setShowRemoveFriendModal,
	);
	const userRecord = useProfileStore((s) => s.userRecord);

	// ── Acciones del store ──
	const handleSelectProviderAvatar = useProfileStore(
		(s) => s.handleSelectProviderAvatar,
	);
	const confirmUnlink = useProfileStore((s) => s.confirmUnlink);
	const closeForcePasswordModal = useProfileStore(
		(s) => s.closeForcePasswordModal,
	);
	const setUnlinkPassword = useProfileStore((s) => s.setUnlinkPassword);
	const acceptRequest = useProfileStore((s) => s.acceptRequest);
	const rejectRequest = useProfileStore((s) => s.rejectRequest);
	const cancelRequest = useProfileStore((s) => s.cancelRequest);
	const removeFriend = useProfileStore((s) => s.removeFriend);
	const handleFileChange = useProfileStore((s) => s.handleFileChange);

	const showGalleryModal = useProfileStore((s) => s.showGalleryModal);
	const setShowGalleryModal = useProfileStore((s) => s.setShowGalleryModal);

	// ── Auth store (datos del usuario actual) ──
	const { user: myUser, socialAccounts: mySocialAccounts } = useAuthStore();

	// ── Datos derivados ──
	const notMyProfile = useProfileStore((s) => s.notMyProfile);
	const displayUser = notMyProfile ? userRecord?.username : myUser;

	// Cuentas sociales para el modal de avatar
	const displaySocialAccounts = notMyProfile
		? null
		: userRecord?.socialAccounts || mySocialAccounts;

	// ── Referencia para el input de archivo ──
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Handler para abrir el diálogo de archivos
	const handleManualUploadClick = (e: FormEvent) => {
		e.preventDefault();
		e.stopPropagation();
		fileInputRef.current?.click();
	};

	return (
		<>
			{/* ── MODAL DE ACTUALIZAR AVATAR ── */}
			{showAvatarModal && (
				<ModalLayout
					title="ACTUALIZAR AVATAR"
					subtitle="Elige tu foto corporativa"
					onClose={() => setShowAvatarModal(false)}
					onSubmit={handleManualUploadClick}
					submitText="Subir foto manual"
				>
					<div className="flex flex-col gap-3 py-2">
						<p
							className="text-sm font-bold text-gray-600 mb-2 font-mono"
							id="avatar-options-label"
						>
							Opciones disponibles:
						</p>
						<div
							className="flex flex-col gap-3"
							role="group"
							aria-labelledby="avatar-options-label"
						>
							{displaySocialAccounts?.map((acc) => (
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
									aria-label={`Usar avatar de ${acc.provider}`}
								>
									Usar avatar de {acc.provider}
								</button>
							))}
						</div>
					</div>
				</ModalLayout>
			)}

			{/* ── MODAL DE DESVINCULAR CUENTA ── */}
			{showUnlinkModal && (
				<ModalLayout
					title="DESVINCULAR CUENTA"
					subtitle={`¿Seguro que quieres quitar ${providerToUnlink?.toUpperCase()}?`}
					onClose={() => setShowUnlinkModal(false)}
					onSubmit={(e) => {
						e.preventDefault();
						confirmUnlink();
					}}
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

			{/* ── MODAL DE CONTRASEÑA FORZADA ── */}
			{showForcePasswordModal && (
				<ModalLayout
					title="ACCIÓN REQUERIDA"
					subtitle="Establece una contraseña de seguridad"
					onClose={closeForcePasswordModal}
					onSubmit={(e) => {
						e.preventDefault();
						confirmUnlink();
					}}
					submitText="Guardar y Desvincular"
					loadingText="Procesando..."
				>
					<div className="flex flex-col gap-4 py-2">
						<div
							className="border-2 border-[#d32f2f] bg-[#d32f2f]/10 p-3"
							role="alert"
							aria-live="assertive"
						>
							<p className="text-sm font-bold text-[#b71c1c] text-justify font-mono leading-tight">
								ALERTA: Esta es tu última cuenta vinculada y no tienes una
								contraseña establecida. Si desvinculas{" "}
								{providerToUnlink?.toUpperCase()} ahora, perderás el acceso a
								esta cuenta.
							</p>
						</div>
						<div className={styles.formGroup}>
							<label className={styles.label} htmlFor="security-password">
								NUEVA CONTRASEÑA
							</label>
							<input
								id="security-password"
								type="password"
								className={`${styles.input} ${unlinkPasswordError ? "border-[#d32f2f]" : ""}`}
								value={unlinkPassword}
								onChange={(e) => setUnlinkPassword(e.target.value)}
								placeholder="Mínimo 8 caracteres"
								required
								minLength={8}
								aria-describedby={
									unlinkPasswordError ? "password-error" : undefined
								}
							/>
							{unlinkPasswordError && (
								<p
									id="password-error"
									className="text-[#d32f2f] text-xs font-bold mt-1 font-mono"
									role="alert"
								>
									{unlinkPasswordError}
								</p>
							)}
						</div>
					</div>
				</ModalLayout>
			)}

			{/* ── MODAL DE SOLICITUDES DE AMISTAD ── */}
			{showFriendRequestsModal && (
				<FriendRequestsModal
					show={showFriendRequestsModal}
					onClose={() => setShowFriendRequestsModal(false)}
					pendingReceived={pendingReceived}
					pendingSent={pendingSent}
					isLoading={friendsLoading}
					onAcceptRequest={acceptRequest}
					onRejectRequest={rejectRequest}
					onCancelRequest={cancelRequest}
				/>
			)}

			{/* ── MODAL CONFIRMAR ELIMINAR AMIGO ── */}
			{showRemoveFriendModal && (
				<ModalLayout
					title="ELIMINAR AMIGO"
					subtitle={`¿Seguro que quieres eliminar a ${displayUser} de tus amigos?`}
					onClose={() => setShowRemoveFriendModal(false)}
					onSubmit={(e) => {
						e.preventDefault();
						if (userRecord?.id) {
							removeFriend(userRecord.id);
						}
					}}
					submitText="Eliminar"
					loadingText="Eliminando..."
				>
					<div className="py-2 text-center text-sm font-mono text-gray-700">
						<p>Esta acción no se puede deshacer.</p>
					</div>
				</ModalLayout>
			)}

			{/* Input oculto para subida de archivos */}
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

			{/* Modal de galería */}
			{showGalleryModal && (
				<GalleryModal onClose={() => setShowGalleryModal(false)} />
			)}
		</>
	);
}
