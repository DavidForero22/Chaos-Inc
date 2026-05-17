// Accesibilidad comprobada: SI

import { useState } from "react";
import { useAuth } from "../../../hooks/useAuth.ts";
import ModalLayout from "../ModalLayout.tsx";
import styles from "../ModalLayout.module.css";
import { GoogleIcon, DiscordIcon } from "./AuthIcons";

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface RegisterModalProps {
	onClose: () => void;
	onSwitchToLogin?: () => void;
	onSuccess?: () => void; // Para auto-unirse a la sala al terminar
	isGuestFlow?: boolean; // Para identificar si venimos de invitado
}

export default function RegisterModal({
	onClose,
	onSwitchToLogin,
	onSuccess,
	isGuestFlow = false,
}: RegisterModalProps) {
	const { register, isLoading, error, clearError } = useAuth();
	const [form, setForm] = useState({
		username: "",
		email: "",
		password: "",
		confirmPassword: "",
	});

	const handleRegister = async (e: React.FormEvent) => {
		e.preventDefault();

		const ok = await register(form);
		if (!ok) return;

		clearError();

		// Si viene del flujo de invitado, auto-unirse a la sala
		if (onSuccess) {
			onSuccess();
			return;
		}

		// Si existe callback, abrir modal de login (comportamiento normal sin invitado)
		if (onSwitchToLogin) {
			onSwitchToLogin();
			return;
		}

		// Fallback por si no se pasa callback
		onClose();
	};

	const handleSocialLogin = (provider: "google" | "discord") => {
		// Guardar la ruta actual para que el backend devuelva a la sala si es necesario
		const currentPath = encodeURIComponent(window.location.pathname);
		window.location.href = `${BACKEND_URL}/auth/${provider}/redirect?return_to=${currentPath}`;
	};

	return (
		<ModalLayout
			title="Chaos Inc."
			subtitle={
				isGuestFlow ? "Regístrate para Unirte" : "Solicitud de Alta de Empleado"
			}
			onClose={onClose}
			onSubmit={handleRegister}
			isLoading={isLoading}
			submitText="Registrarse"
			loadingText="Procesando..."
			disableBackdropClick={isGuestFlow} // Bloquea cerrar haciendo clic fuera
			switchButton={
				onSwitchToLogin && (
					<button
						type="button"
						className={styles.switchLink}
						onClick={() => {
							clearError();
							onSwitchToLogin();
						}}
					>
						← Ya tengo cuenta
					</button>
				)
			}
		>
			{/* Campo: Nombre de Usuario */}
			<div className={styles.fieldRow}>
				<span className={styles.annexNum} aria-hidden="true">
					1.
				</span>
				<div className={styles.fieldWrap}>
					<label
						className={`${styles.label} ${styles.labelFirst}`}
						id="username-label"
					>
						Nombre de Usuario *
					</label>
					<input
						className={styles.input}
						type="text"
						placeholder="Escribe tu nombre..."
						required
						minLength={3}
						maxLength={30}
						autoFocus
						value={form.username}
						onChange={(e) =>
							setForm((prev) => ({ ...prev, username: e.target.value }))
						}
						aria-labelledby="username-label"
						aria-required="true"
						aria-describedby="username-hint"
					/>
					<p id="username-hint" className={styles.hint} aria-live="polite">
						3-30 caracteres.
					</p>
				</div>
			</div>

			{/* Campo: Correo Electrónico */}
			<div className={styles.fieldRow}>
				<span className={styles.annexNum} aria-hidden="true">
					2.
				</span>
				<div className={styles.fieldWrap}>
					<label className={styles.label} id="email-label">
						Correo Electrónico *
					</label>
					<input
						className={styles.input}
						type="email"
						placeholder="Escribe tu correo..."
						minLength={3}
						maxLength={255}
						required
						value={form.email}
						onChange={(e) =>
							setForm((prev) => ({ ...prev, email: e.target.value }))
						}
						aria-labelledby="email-label"
						aria-required="true"
					/>
				</div>
			</div>

			{/* Campo: Contraseña */}
			<div className={styles.fieldRow}>
				<span className={styles.annexNum} aria-hidden="true">
					3.
				</span>
				<div className={styles.fieldWrap}>
					<label className={styles.label} id="password-label">
						Contraseña *
					</label>
					<input
						className={styles.input}
						type="password"
						placeholder="••••••••"
						required
						minLength={8}
						maxLength={128}
						value={form.password}
						onChange={(e) =>
							setForm((prev) => ({ ...prev, password: e.target.value }))
						}
						aria-labelledby="password-label"
						aria-required="true"
						aria-describedby="password-hint"
					/>
					<p id="password-hint" className={styles.hint} aria-live="polite">
						Mínimo 8 caracteres.
					</p>
				</div>
			</div>

			{/* Campo: Confirmar Contraseña */}
			<div className={styles.fieldRow}>
				<span className={styles.annexNum} aria-hidden="true">
					4.
				</span>
				<div className={styles.fieldWrap}>
					<label className={styles.label} id="confirm-password-label">
						Confirmar Contraseña *
					</label>
					<input
						className={styles.input}
						type="password"
						placeholder="••••••••"
						required
						minLength={8}
						maxLength={128}
						value={form.confirmPassword}
						onChange={(e) =>
							setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
						}
						aria-labelledby="confirm-password-label"
						aria-required="true"
					/>
				</div>
			</div>

			{/* Separador OAuth */}
			<div className={styles.socialDivider} role="separator">
				<div className={styles.socialDividerLine} aria-hidden="true" />
				<span className={styles.socialDividerText}>o regístrate con</span>
				<div className={styles.socialDividerLine} aria-hidden="true" />
			</div>

			{/* Botones OAuth */}
			<div className={styles.socialButtons}>
				<button
					type="button"
					className={`${styles.btnSocial} ${styles.btnGoogle}`}
					onClick={() => handleSocialLogin("google")}
					aria-label="Registrarse con Google"
				>
					<GoogleIcon aria-hidden="true" />
					Google
				</button>
				<button
					type="button"
					className={`${styles.btnSocial} ${styles.btnDiscord}`}
					onClick={() => handleSocialLogin("discord")}
					aria-label="Registrarse con Discord"
				>
					<DiscordIcon aria-hidden="true" />
					Discord
				</button>
			</div>

			{/* Mensaje de error */}
			{error && (
				<p className={styles.error} role="alert">
					⚠ {error}
				</p>
			)}
		</ModalLayout>
	);
}
