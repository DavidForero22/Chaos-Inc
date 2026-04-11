import { useState } from "react";
import api from "../../../api/axios";
import { useAuthStore } from "../../../store/useAuthStore.ts";
import ModalLayout from "../ModalLayout.tsx";
import styles from "../ModalLayout.module.css";

interface LoginModalProps {
	onClose: () => void;
	onSwitchToRegister?: () => void;
}

export default function LoginModal({
	onClose,
	onSwitchToRegister,
}: LoginModalProps) {
	const { setAuth } = useAuthStore();
	const [credentials, setCredentials] = useState({ login: "", password: "" });
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setIsLoading(true);
		try {
			const res = await api.post("/login", credentials);
			setAuth(
				res.data.user.username,
				res.data.token,
				false,
				res.data.user.role,
			);
			onClose();
		} catch {
			setError("Credenciales incorrectas. Verifique su identificación.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<ModalLayout
			title="Chaos Inc."
			subtitle="Formulario de Identificación de Empleado"
			onClose={onClose}
			onSubmit={handleLogin}
			isLoading={isLoading}
			submitText="Entrar"
			loadingText="Verificando..."
			switchButton={
				onSwitchToRegister && (
					<button
						type="button"
						className={styles.switchLink}
						onClick={onSwitchToRegister}
					>
						← ¿Sin cuenta? Registrarse
					</button>
				)
			}
		>
			<label className={styles.label}>Identificador</label>
			<input
				className={styles.input}
				type="text"
				placeholder="usuario o correo electrónico"
				required
				autoFocus
				value={credentials.login}
				onChange={(e) =>
					setCredentials({ ...credentials, login: e.target.value })
				}
			/>

			<label className={`${styles.label} ${styles.labelSpaced}`}>
				Contraseña
			</label>
			<input
				className={styles.input}
				type="password"
				placeholder="••••••••"
				required
				value={credentials.password}
				onChange={(e) =>
					setCredentials({ ...credentials, password: e.target.value })
				}
			/>

			{error && <p className={styles.error}>⚠ {error}</p>}
		</ModalLayout>
	);
}
