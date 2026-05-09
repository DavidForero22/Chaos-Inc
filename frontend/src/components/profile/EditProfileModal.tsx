// src/components/profile/EditProfileModal.tsx

import { useState, type FormEvent } from "react";
import ModalLayout from "../ui/ModalLayout";
import styles from "./EditProfileModal.module.css";
import type { UserRecord } from "../../types/api";

interface EditProfileModalProps {
	user?: UserRecord | null;
	onClose: () => void;
	onSubmit: (data: any) => Promise<void>;
	isLoading?: boolean;
}

export default function EditProfileModal({
	user,
	onClose,
	onSubmit,
	isLoading = false,
}: EditProfileModalProps) {
	const [username, setUsername] = useState(user?.username || "");
	const [email, setEmail] = useState(user?.email || "");
	const [password, setPassword] = useState("");

	// ESTADOS PARA ERRORES
	const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
	const [generalError, setGeneralError] = useState<string | null>(null);

	const isOAuthUser =
		(user?.socialAccounts && user.socialAccounts.length > 0) || false;

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();

		// Limpiar los errores antes de un nuevo intento
		setFieldErrors({});
		setGeneralError(null);

		const payload: any = {};
		if (username.trim() !== "" && username !== user?.username)
			payload.username = username;
		if (!isOAuthUser && email !== user?.email && email.trim() !== "")
			payload.email = email;
		if (password.trim() !== "") payload.password = password;

		try {
			// Esperar la respuesta. Si falla, saltará al catch
			await onSubmit(payload);
		} catch (err: any) {
			// Si es un error 422 de validación
			if (err.response?.status === 422) {
				setFieldErrors(err.response.data.errors);
			} else {
				// Otro tipo de error (500, error de red, etc)
				setGeneralError(
					err.response?.data?.message ||
						"Ocurrió un error inesperado al actualizar.",
				);
			}
		}
	};

	return (
		<ModalLayout
			title="EDITAR IDENTIDAD"
			subtitle="Modifica tus credenciales de acceso"
			onClose={onClose}
			onSubmit={handleSubmit}
			isLoading={isLoading}
			submitText="GUARDAR CAMBIOS"
		>
			<div className={styles.formGroup}>
				<label className={styles.label}>NOMBRE DE USUARIO</label>
				<input
					type="text"
					className={`${styles.input} ${fieldErrors.username ? styles.inputError : ""}`}
					value={username}
					onChange={(e) => setUsername(e.target.value)}
					placeholder="Nuevo nombre de usuario"
					required
				/>
				{fieldErrors.username && (
					<p className={styles.errorText}>{fieldErrors.username[0]}</p>
				)}
			</div>

			<div className={styles.formGroup}>
				<label className={styles.label}>CORREO ELECTRÓNICO</label>
				<input
					type="email"
					className={`${styles.input} ${isOAuthUser ? styles.inputDisabled : ""} ${fieldErrors.email ? styles.inputError : ""}`}
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					placeholder="ejemplo@correo.com"
					disabled={isOAuthUser}
				/>
				{isOAuthUser && (
					<p className={styles.oauthWarning}>
						[BLOQUEADO] Tu cuenta está vinculada a un proveedor externo. La
						modificación de correo no está permitida.
					</p>
				)}
				{fieldErrors.email && (
					<p className={styles.errorText}>{fieldErrors.email[0]}</p>
				)}
			</div>

			<div className={styles.formGroup}>
				<label className={styles.label}>NUEVA CONTRASEÑA</label>
				<input
					type="password"
					className={`${styles.input} ${fieldErrors.password ? styles.inputError : ""}`}
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					placeholder="Deja en blanco para mantener la actual"
					minLength={8}
				/>
				{fieldErrors.password && (
					<p className={styles.errorText}>{fieldErrors.password[0]}</p>
				)}
			</div>

			{/* ERROR GENERAL */}
			{generalError && (
				<div className={`${styles.warningBox} ${styles.criticalWarning} mt-4`}>
					<p className={styles.warningText}>
						<strong>ERROR:</strong> {generalError}
					</p>
				</div>
			)}
		</ModalLayout>
	);
}
