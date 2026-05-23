// src/pages/PublicProfilePage.tsx
// Accesibilidad comprobada: SI

import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth/useAuthStore";
import { useUserProfileData } from "../../hooks/profile/useUserProfileData";
import RegisteredProfileView from "../../components/profile/RegisteredProfileView";
import GuestProfileView from "../../components/profile/GuestProfileView";
import styles from "../../components/profile/Profile.module.css";
import api from "../../api/axios";
import { ProfileProvider } from "../../store/profile/useProfileStore";
import { useCallback, useState } from "react";
import { useAuth } from "../../hooks/auth/useAuth";
import { getFullAvatarUrl } from "../../utils/avatar";

export default function PublicProfilePage() {
	const { userId } = useParams<{ userId: string }>();
	const { id: myId, logout, isGuest, setAuth } = useAuthStore();
	const navigate = useNavigate();
	const { updateProfile } = useAuth();

	// ¿Es mi perfil o el de otro?
	const isMe = String(myId) === userId;

	const [refreshKey, setRefreshKey] = useState(0);
	const {
		games,
		profileUser,
		loading,
		pendingReceived,
		pendingSent,
		friendsLoading,
	} = useUserProfileData(userId, refreshKey);

	const refreshProfile = useCallback(async () => {
		// Si es mi perfil, obtener datos actualizados y actualizar AuthStore
		if (isMe && myId) {
			try {
				const response = await api.get(`/users/${myId}`);
				const updatedUser = response.data.data ?? response.data;

				// Actualizar AuthStore con los datos más recientes
				setAuth(
					updatedUser.id,
					updatedUser.username,
					getFullAvatarUrl(updatedUser.avatar),
					updatedUser.isGuest,
					updatedUser.role,
					updatedUser.socialAccounts,
					updatedUser.joinedAt,
					updatedUser.achievements,
				);
			} catch (error) {
				console.error("Error refreshing auth store:", error);
			}
		}

		// Incrementar refreshKey para recargar los datos del perfil
		setRefreshKey((prev) => prev + 1);
	}, [isMe, myId, setAuth]);

	// Acciones manuales para no tener que llamar a useProfileData y duplicar peticiones
	const handleLogout = async () => {
		try {
			await api.post("/logout");
		} catch {}
		logout();
		navigate("/");
	};

	if (myId == null) {
		return (
			<main
				className={styles.loadingWrapper}
				role="status"
				aria-live="polite"
				aria-label="Estado de autenticación"
			>
				<span>Debes tener una cuenta activa para consultar perfiles.</span>
			</main>
		);
	}

	if (isGuest && isMe) {
		return <GuestProfileView onLogout={handleLogout} />;
	}

	if (loading) {
		return (
			<main
				className={styles.loadingWrapper}
				role="status"
				aria-live="polite"
				aria-label="Cargando perfil"
				aria-busy="true"
			>
				<div className={styles.loadingSpinner} aria-hidden="true" />
				<span className={styles.loadingText}>Cargando perfil...</span>
			</main>
		);
	}

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

	const handleUpdateProfile = async (data: any) => {
		await updateProfile(data);
		refreshProfile();
	};

	return (
		<main>
			<ProfileProvider
				userId={Number(userId)}
				notMyProfile={!isMe}
				games={games}
				userRecord={profileUser}
				pendingReceived={pendingReceived}
				pendingSent={pendingSent}
				friendsLoading={friendsLoading}
				onLogout={isMe ? handleLogout : undefined}
				onDeleteAccount={isMe ? handleDeleteAccount : undefined}
				onUpdateProfile={isMe ? handleUpdateProfile : undefined}
				refreshProfile={refreshProfile}
			>
				<RegisteredProfileView />
			</ProfileProvider>
		</main>
	);
}
