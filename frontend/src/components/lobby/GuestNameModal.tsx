// src/components/lobby/GuestNameModal.tsx

import { useState } from "react";
import api from "../../api/axios";
import { useAuthStore } from "../../store/useAuthStore";
import ModalLayout from "../ui/ModalLayout";
import styles from "../ui/ModalLayout.module.css";

interface GuestNameModalProps {
	onClose: () => void;
	onSuccess: () => void;
}

export default function GuestNameModal({
	onClose,
	onSuccess,
}: GuestNameModalProps) {
	const { setAuth } = useAuthStore();
	const [username, setUsername] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!username.trim()) return;

		setLoading(true);
		setError("");

		try {
			// Llamamos al nuevo endpoint que creamos en Laravel
			const res = await api.post("/guest-login", { username });

			// Guardamos el token real que nos da el backend
			// El tercer parámetro 'true' marca que es un invitado
			setAuth(res.data.user.username, res.data.token, true);

			onSuccess();
		} catch (err) {
			console.error(err);
			setError("Error al conectar con el servidor.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<ModalLayout
			title="Chaos Inc."
			subtitle="Pase de Visitante Temporal"
			onClose={onClose}
			onSubmit={handleSubmit}
			isLoading={loading}
			submitText="Entrar como Invitado"
			loadingText="Autorizando..."
		>
			<div className={styles.fieldRow}>
				<span className={styles.annexNum}>1.</span>
				<div className={styles.fieldWrap}>
					<label className={`${styles.label} ${styles.labelFirst}`}>
						Nombre de Usuario
					</label>
					<input
						className={styles.input}
						type="text"
						placeholder="Ingresa tu nombre..."
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						required
						autoFocus
						maxLength={15}
					/>
					<p className={styles.hint}>
						Ingresa un nombre para unirte a la partida temporalmente.
					</p>
				</div>
			</div>

			{error && <p className={styles.error}>⚠ {error}</p>}
		</ModalLayout>
	);
}
