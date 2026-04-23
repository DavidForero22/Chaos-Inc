import { useState } from "react";
import api from "../../../api/axios";
import { useAuthStore } from "../../../store/useAuthStore.ts";
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
	const { setAuth } = useAuthStore();
	const [form, setForm] = useState({
		username: "",
		email: "",
		password: "",
		confirmPassword: "",
	});
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const handleRegister = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		// Validar que las contraseñas coincidan
		if (form.password !== form.confirmPassword) {
			setError("Las contraseñas no coinciden.");
			return;
		}

		setIsLoading(true);
		try {
			const res = await api.post("/register", {
				username: form.username,
				email: form.email,
				password: form.password,
			});
			setAuth(
				res.data.user.username,
				res.data.token,
				false,
				res.data.user.role,
			);
			onClose();
		} catch {
			setError("El nombre o correo ya están en uso.");
		} finally {
			setIsLoading(false);
		}
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
						onClick={onSwitchToLogin}
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
						autoFocus
						value={form.username}
						onChange={(e) => setForm({ ...form, username: e.target.value })}
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
						onChange={(e) => setForm({ ...form, email: e.target.value })}
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
						value={form.password}
						minLength={8}
						onChange={(e) => setForm({ ...form, password: e.target.value })}
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
						value={form.confirmPassword}
						minLength={8}
						onChange={(e) =>
							setForm({ ...form, confirmPassword: e.target.value })
						}
					/>
				</div>
			</div>

			{error && <p className={styles.error}>⚠ {error}</p>}
		</ModalLayout>
	);
}
