// src/pages/ProfilePage.tsx

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import GuestProfileView from "../components/profile/GuestProfileView";
import api from "../api/axios";
import styles from "../components/profile/Profile.module.css";

export default function ProfilePage() {
	const { isGuest, id, logout } = useAuthStore();
	const navigate = useNavigate();

	const isAnonymous = isGuest || !id;

	// Si es un usuario registrado, mandar a su URL única
	useEffect(() => {
		if (!isAnonymous && id) {
			navigate(`/profile/${id}`, { replace: true });
		}
	}, [isAnonymous, id, navigate]);

	// Función de logout ligera exclusiva para invitados
	const handleGuestLogout = async () => {
		try {
			await api.post("/logout");
		} catch {}
		logout();
		navigate("/");
	};

	if (!id) {
		return (
			<div className={styles.loadingWrapper}>
				<span >
					Debes tener una cuenta activa para acceder al perfil.
				</span>
			</div>
		);
	}

	// Los invitados se quedan en /profile porque no tienen un ID real persistente
	if (isAnonymous) {
		return <GuestProfileView onLogout={handleGuestLogout} />;
	}

	// Mientras calcula si es invitado o hace el redirect
	return (
		<div className={styles.loadingWrapper}>
			<div className={styles.loadingSpinner} />
			<span className={styles.loadingText}>
				Accediendo a la base de datos...
			</span>
		</div>
	);
}
