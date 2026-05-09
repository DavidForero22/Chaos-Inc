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
			<div className={styles.fieldRow}>
				<span className={styles.annexNum}>1.</span>
				<div className={styles.fieldWrap}>
					<label className={`${styles.label} ${styles.labelFirst}`}>
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
					/>
				</div>
			</div>

			<div className={styles.fieldRow}>
				<span className={styles.annexNum}>2.</span>
				<div className={styles.fieldWrap}>
					<label className={styles.label}>Correo Electrónico *</label>
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
					/>
				</div>
			</div>

			<div className={styles.fieldRow}>
				<span className={styles.annexNum}>3.</span>
				<div className={styles.fieldWrap}>
					<label className={styles.label}>Contraseña *</label>
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
					/>
					<p className={styles.hint}>Mínimo 8 caracteres.</p>
				</div>
			</div>

			<div className={styles.fieldRow}>
				<span className={styles.annexNum}>4.</span>
				<div className={styles.fieldWrap}>
					<label className={styles.label}>Confirmar Contraseña *</label>
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
					/>
				</div>
			</div>

			{/* Separador OAuth */}
			<div className={styles.socialDivider}>
				<div className={styles.socialDividerLine} />
				<span className={styles.socialDividerText}>o regístrate con</span>
				<div className={styles.socialDividerLine} />
			</div>

			{/* Botones OAuth */}
			<div className={styles.socialButtons}>
				<button
					type="button"
					className={`${styles.btnSocial} ${styles.btnGoogle}`}
					onClick={() => handleSocialLogin("google")}
				>
					<GoogleIcon />
					Google
				</button>
				<button
					type="button"
					className={`${styles.btnSocial} ${styles.btnDiscord}`}
					onClick={() => handleSocialLogin("discord")}
				>
					<DiscordIcon />
					Discord
				</button>
			</div>

			{error && <p className={styles.error}>⚠ {error}</p>}
		</ModalLayout>
	);
}
