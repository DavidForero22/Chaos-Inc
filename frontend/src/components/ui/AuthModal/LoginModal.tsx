// Accesibilidad comprobada: SI

import { useState } from "react";
import { useAuth } from "../../../hooks/auth/useAuth.ts";
import ModalLayout from "../ModalLayout";
import styles from "../ModalLayout.module.css";
import { GoogleIcon, DiscordIcon } from "./AuthIcons";

interface LoginModalProps {
	onClose: () => void;
	onSwitchToRegister?: () => void;
	onSuccess?: () => void; // Para auto-unirse a la sala
	isGuestFlow?: boolean; // Para saber de dónde viene el user
}

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function LoginModal({
	onClose,
	onSwitchToRegister,
	onSuccess,
	isGuestFlow = false,
}: LoginModalProps) {
	const { login, isLoading, error, clearError } = useAuth();
	const [credentials, setCredentials] = useState({
		email: "",
		password: "",
		remember: false,
	});

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		const ok = await login(credentials);
		if (ok) {
			if (onSuccess) onSuccess();
			else onClose();
		}
	};

	const handleSocialLogin = (provider: "google" | "discord") => {
		// Obtener la ruta actual (ej: /room/123) para decirle al backend que devuelva aquí
		const currentPath = encodeURIComponent(window.location.pathname);
		window.location.href = `${BACKEND_URL}/auth/${provider}/redirect?return_to=${currentPath}`;
	};

	return (
		<ModalLayout
			title="Chaos Inc."
			subtitle={
				isGuestFlow ? "Inicia Sesión para Unirte" : "Acceso de Empleado"
			}
			onClose={onClose}
			onSubmit={handleLogin}
			isLoading={isLoading}
			submitText="Acceder"
			loadingText="Verificando..."
			disableBackdropClick={isGuestFlow} // Evita cerrar si viene de invitado
			switchButton={
				onSwitchToRegister && (
					<button
						type="button"
						className={styles.switchLink}
						onClick={() => {
							clearError();
							onSwitchToRegister();
						}}
					>
						→ Crear cuenta
					</button>
				)
			}
		>
			{/* Campo: Correo */}
			<div className={styles.fieldRow}>
				<span className={styles.annexNum} aria-hidden="true">
					1.
				</span>
				<div className={styles.fieldWrap}>
					<label
						className={`${styles.label} ${styles.labelFirst}`}
						id="login-label"
					>
						Correo electrónico
					</label>
					<input
						className={styles.input}
						type="text"
						placeholder="Tu correo..."
						required
						autoFocus
						value={credentials.email}
						onChange={(e) =>
							setCredentials((prev) => ({ ...prev, email: e.target.value }))
						}
						aria-labelledby="login-label"
						aria-required="true"
					/>
				</div>
			</div>

			{/* Campo: Contraseña */}
			<div className={styles.fieldRow}>
				<span className={styles.annexNum} aria-hidden="true">
					2.
				</span>
				<div className={styles.fieldWrap}>
					<label className={styles.label} id="password-label">
						Contraseña
					</label>
					<input
						className={styles.input}
						type="password"
						placeholder="••••••••"
						minLength={8}
						maxLength={128}
						required
						value={credentials.password}
						onChange={(e) =>
							setCredentials((prev) => ({ ...prev, password: e.target.value }))
						}
						aria-labelledby="password-label"
						aria-required="true"
					/>
				</div>
			</div>

			{/* Recordar sesión */}
			<div className={styles.fieldRow}>
				<span className={styles.annexNum} aria-hidden="true"></span>
				<div
					className={styles.fieldWrap}
					style={{
						display: "flex",
						flexDirection: "row",
						alignItems: "center",
						gap: "8px",
						paddingTop: "14px",
					}}
				>
					<input
						type="checkbox"
						id="remember-me"
						checked={credentials.remember}
						onChange={(e) =>
							setCredentials((prev) => ({
								...prev,
								remember: e.target.checked,
							}))
						}
						style={{ cursor: "pointer", width: "16px", height: "16px" }}
					/>
					<label
						htmlFor="remember-me"
						className={styles.label}
						style={{ cursor: "pointer", margin: 0 }}
					>
						Mantener sesión iniciada
					</label>
				</div>
			</div>

			{/* Separador OAuth */}
			<div className={styles.socialDivider} role="separator">
				<div className={styles.socialDividerLine} aria-hidden="true" />
				<span className={styles.socialDividerText}>o continúa con</span>
				<div className={styles.socialDividerLine} aria-hidden="true" />
			</div>

			{/* Botones OAuth */}
			<div className={styles.socialButtons}>
				<button
					type="button"
					className={`${styles.btnSocial} ${styles.btnGoogle}`}
					onClick={() => handleSocialLogin("google")}
					aria-label="Iniciar sesión con Google"
				>
					<GoogleIcon aria-hidden="true" />
					Google
				</button>
				<button
					type="button"
					className={`${styles.btnSocial} ${styles.btnDiscord}`}
					onClick={() => handleSocialLogin("discord")}
					aria-label="Iniciar sesión con Discord"
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
