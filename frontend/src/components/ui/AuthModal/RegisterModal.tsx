import { useState } from "react";
import { useAuth } from "../../../hooks/useAuth.ts";
import ModalLayout from "../ModalLayout.tsx";
import styles from "../ModalLayout.module.css";

interface RegisterModalProps {
	onClose: () => void;
	onSwitchToLogin?: () => void;
}

export default function RegisterModal({
	onClose,
	onSwitchToLogin,
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
		if (ok) onClose();
	};

	return (
		<ModalLayout
			title="Chaos Inc."
			subtitle="Solicitud de Alta de Empleado"
			onClose={onClose}
			onSubmit={handleRegister}
			isLoading={isLoading}
			submitText="Registrarse"
			loadingText="Procesando..."
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
						minLength={2}
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
						value={form.confirmPassword}
						onChange={(e) =>
							setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
						}
					/>
				</div>
			</div>

			{error && <p className={styles.error}>⚠ {error}</p>}
		</ModalLayout>
	);
}
