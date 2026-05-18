// src/components/profile/ProfileModals.tsx
import ModalLayout from "../../ui/ModalLayout";
import styles from "./UserInfo.module.css";
import type { SocialAccountInfo } from "../../../types/user.ts";

interface ProfileModalsProps {
	showAvatarModal: boolean;
	setShowAvatarModal: (v: boolean) => void;
	socialAccounts?: SocialAccountInfo[] | null;
	handleSelectProviderAvatar: (
		provider: string,
		avatarUrl: string | null,
	) => void;
	handleManualUploadClick: () => void;

	showUnlinkModal: boolean;
	setShowUnlinkModal: (v: boolean) => void;
	providerToUnlink?: string | null;
	isUnlinking: boolean;
	confirmUnlink: () => void;

	showForcePasswordModal: boolean;
	closeForcePasswordModal: () => void;
	unlinkPassword: string;
	setUnlinkPassword: (v: string) => void;
	unlinkPasswordError?: string;
}

export default function ProfileModals({
	showAvatarModal,
	setShowAvatarModal,
	socialAccounts,
	handleSelectProviderAvatar,
	handleManualUploadClick,

	showUnlinkModal,
	setShowUnlinkModal,
	providerToUnlink,
	isUnlinking,
	confirmUnlink,

	showForcePasswordModal,
	closeForcePasswordModal,
	unlinkPassword,
	setUnlinkPassword,
	unlinkPasswordError,
}: ProfileModalsProps) {
	return (
		<>
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
									aria-label={`Usar avatar de ${acc.provider}`}
								>
									Usar avatar de {acc.provider}
								</button>
							))}
						</div>
					</div>
				</ModalLayout>
			)}

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
		</>
	);
}
