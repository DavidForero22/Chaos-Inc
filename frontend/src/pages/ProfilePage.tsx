// src/pages/ProfilePage.tsx

import { useAuthStore } from "../store/useAuthStore.ts";
import { useProfileData } from "../hooks/profile/useProfileData.ts";
import GuestProfileView from "../components/profile/GuestProfileView.tsx";
import RegisteredProfileView from "../components/profile/RegisteredProfileView.tsx";

export default function ProfilePage() {
	const { isGuest } = useAuthStore();
	const { games, loading, handleLogout, handleDeleteAccount } =
		useProfileData();

	if (loading) {
		return (
			<div className="flex justify-center items-center h-[60vh]">
				<div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
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
