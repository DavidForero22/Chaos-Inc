import { useState } from "react";
import { useAuth } from "../../../hooks/useAuth.ts";
import ModalLayout from "../ModalLayout";
import styles from "../ModalLayout.module.css";

interface LoginModalProps {
	onClose: () => void;
	onSwitchToRegister?: () => void;
}

export default function LoginModal({
	onClose,
	onSwitchToRegister,
}: LoginModalProps) {
	const { login, isLoading, error, clearError } = useAuth();
	const [credentials, setCredentials] = useState({
		login: "",
		password: "",
	});

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();

		const ok = await login(credentials);
		if (ok) onClose();
	};

	return (
		<ModalLayout
			title="Chaos Inc."
			subtitle="Acceso de Empleado"
			onClose={onClose}
			onSubmit={handleLogin}
			isLoading={isLoading}
			submitText="Acceder"
			loadingText="Verificando..."
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
			<div className={styles.fieldRow}>
				<span className={styles.annexNum}>1.</span>
				<div className={styles.fieldWrap}>
					<label className={`${styles.label} ${styles.labelFirst}`}>
						Usuario o Correo
					</label>
					<input
						className={styles.input}
						type="text"
						placeholder="Escribe aquí..."
						required
						autoFocus
						value={credentials.login}
						onChange={(e) =>
							setCredentials((prev) => ({ ...prev, login: e.target.value }))
						}
					/>
				</div>
			</div>

			<div className={styles.fieldRow}>
				<span className={styles.annexNum}>2.</span>
				<div className={styles.fieldWrap}>
					<label className={styles.label}>Contraseña</label>
					<input
						className={styles.input}
						type="password"
						placeholder="••••••••"
						minLength={8}
						required
						value={credentials.password}
						onChange={(e) =>
							setCredentials((prev) => ({ ...prev, password: e.target.value }))
						}
					/>
				</div>
			</div>

			{error && <p className={styles.error}>⚠ {error}</p>}
		</ModalLayout>
	);
}
