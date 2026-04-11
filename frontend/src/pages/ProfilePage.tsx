// src/pages/ProfilePage.tsx

import { useAuthStore } from "../store/useAuthStore";
import { useProfileData } from "../hooks/profile/useProfileData";
import GuestProfileView from "../components/profile/GuestProfileView";
import RegisteredProfileView from "../components/profile/RegisteredProfileView";
import styles from "../components/profile/Profile.module.css";

export default function ProfilePage() {
	const { isGuest } = useAuthStore();
	const { games, loading, handleLogout, handleDeleteAccount } =
		useProfileData();

	if (loading) {
		return (
			<div className={styles.loadingWrapper}>
				<div className={styles.loadingSpinner} />
				<span className={styles.loadingText}>Cargando perfil...</span>
			</div>
		);
	}

	if (isGuest) {
		return <GuestProfileView onLogout={handleLogout} />;
	}

	return (
		<RegisteredProfileView
			games={games}
			onLogout={handleLogout}
			onDeleteAccount={handleDeleteAccount}
		/>
	);
}
