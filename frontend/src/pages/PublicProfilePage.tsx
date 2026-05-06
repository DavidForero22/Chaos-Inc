// src/pages/PublicProfilePage.tsx

import { useParams } from "react-router-dom";
import { usePublicProfileData } from "../hooks/profile/usePublicProfileData";
import RegisteredProfileView from "../components/profile/RegisteredProfileView";
import styles from "../components/profile/Profile.module.css";

export default function PublicProfilePage() {
	const { userId } = useParams<{ userId: string }>();
	const { games, profileUser, loading } = usePublicProfileData(userId);

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
			notMyProfile
		/>
	);
}
