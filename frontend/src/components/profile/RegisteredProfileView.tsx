// src/components/profile/RegisteredProfileView.tsx

import { useState } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import type { GameRecord, UserRecord } from "../../types/api";

import styles from "./RegisteredProfileView.module.css";

import UserInfo from "./UserInfo";
import GraphsProfile from "./GraphsProfile";
import GameHistory from "./GameHistory";

interface RegisteredProfileViewProps {
	games: GameRecord[];
	onLogout?: () => void;
	onDeleteAccount?: () => void;
	onUpdateProfile?: (data: any) => Promise<void>;
	notMyProfile?: boolean;
	publicProfile?: UserRecord | null;
	myProfile?: UserRecord | null;
}

export default function RegisteredProfileView({
	games,
	onLogout,
	onDeleteAccount,
	onUpdateProfile,
	notMyProfile = false,
	publicProfile = null,
	myProfile = null,
}: RegisteredProfileViewProps) {
	const { id, user, role, avatar, socialAccounts, joinedAt } = useAuthStore();
	const [activeTab, setActiveTab] = useState<"info" | "stats" | "history">(
		"info",
	);

	const displayId = notMyProfile ? publicProfile?.id : id;
	const displayUser = notMyProfile ? publicProfile?.username : user;
	const displayRole = notMyProfile ? publicProfile?.role : role;
	const displayJoinedAt = notMyProfile
		? publicProfile?.joinedAt
		: (myProfile?.joinedAt ?? joinedAt);
	const displayAvatar = notMyProfile ? publicProfile?.avatar : avatar;

	// Verificar si el perfil que miramos es el mismo perfil de quien lo ve
	const isActuallyMe = !notMyProfile && id === displayId;

	// Si es propio, priorizar los datos recién traídos de /users/{id} (myProfile)
	// Si falla, caer en el store. Si no es propio, SIEMPRE null.
	const displaySocialAccounts = isActuallyMe
		? myProfile?.socialAccounts || socialAccounts
		: null;

	const displayAchievements = notMyProfile
		? publicProfile?.achievements
		: myProfile?.achievements;

	return (
		<div className={styles.dossierContainer}>
			<div className={styles.dossier}>
				<div className={`${styles.tape} ${styles.tapeTopLeft}`} />
				<div className={`${styles.tape} ${styles.tapeTopRight}`} />
				<div className={`${styles.tape} ${styles.tapeBottomLeft}`} />
				<div className={`${styles.tape} ${styles.tapeBottomRight}`} />

				<div className={styles.topSecretHeader}>
					<span>CHAOS INC. // DPTO. RECURSOS HUMANOS</span>
					<span className={styles.expedientNumber}>
						EXP. #{displayId?.toString().padStart(4, "0") || "0000"}
					</span>
				</div>

				<div className={styles.navMenu}>
					<button
						className={`${styles.navBtn} ${activeTab === "info" ? styles.navBtnActive : ""}`}
						onClick={() => setActiveTab("info")}
					>
						[INFORMACIÓN]
					</button>
					<button
						className={`${styles.navBtn} ${activeTab === "stats" ? styles.navBtnActive : ""}`}
						onClick={() => setActiveTab("stats")}
					>
						[ESTADÍSTICAS]
					</button>
					<button
						className={`${styles.navBtn} ${activeTab === "history" ? styles.navBtnActive : ""}`}
						onClick={() => setActiveTab("history")}
					>
						[HISTORIAL]
					</button>
				</div>

				<div className={styles.divider} />

				<div className={styles.sectionsWrapper}>
					{activeTab === "info" && (
						<UserInfo
							userId={Number(displayId)}
							notMyProfile={notMyProfile}
							userRecord={notMyProfile ? publicProfile : myProfile}
							displayUser={displayUser}
							displayRole={displayRole}
							displayJoinedAt={displayJoinedAt}
							avatar={displayAvatar}
							socialAccounts={displaySocialAccounts}
							achievements={displayAchievements}
							onLogout={onLogout}
							onDeleteAccount={onDeleteAccount}
							onUpdateProfile={onUpdateProfile}
						/>
					)}

					{activeTab === "stats" && (
						<GraphsProfile games={games} user={displayUser} />
					)}

					{activeTab === "history" && (
						<GameHistory games={games} user={displayUser} />
					)}
				</div>
			</div>
		</div>
	);
}
