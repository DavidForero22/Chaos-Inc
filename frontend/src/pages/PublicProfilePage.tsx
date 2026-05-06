// src/pages/PublicProfilePage.tsx

import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { usePublicProfileData } from "../hooks/profile/usePublicProfileData";
import RegisteredProfileView from "../components/profile/RegisteredProfileView";
import styles from "../components/profile/Profile.module.css";
import api from "../api/axios";

export default function PublicProfilePage() {
	const { userId } = useParams<{ userId: string }>();
	const { id: myId, logout } = useAuthStore();
	const navigate = useNavigate();

	// ¿Es mi perfil o el de otro?
	const isMe = String(myId) === userId;

	const { games, profileUser, loading } = usePublicProfileData(userId);

	// Acciones manuales para no tener que llamar a useProfileData y duplicar peticiones
	const handleLogout = async () => {
		try {
			await api.post("/logout");
		} catch {}
		logout();
		navigate("/");
	};

	const handleDeleteAccount = async () => {
		if (!myId) return;
		try {
			await api.delete(`/users/${myId}`);
			logout();
			navigate("/");
		} catch (e: any) {
			alert(e.response?.data?.message || "Error al eliminar la cuenta.");
		}
	};

	if (loading) {
		return (
			<div className={styles.loadingWrapper}>
				<div className={styles.loadingSpinner} />
				<span className={styles.loadingText}>Cargando perfil...</span>
			</div>
		);
	}

	return (
		<RegisteredProfileView
			games={games}
			publicProfile={profileUser}
			notMyProfile={!isMe}
			onLogout={isMe ? handleLogout : undefined}
			onDeleteAccount={isMe ? handleDeleteAccount : undefined}
		/>
	);
}
