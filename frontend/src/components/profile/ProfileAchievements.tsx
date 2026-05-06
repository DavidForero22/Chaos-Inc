// src/components/profile/ProfileAchievements.tsx

import { ACHIEVEMENTS } from "../../data/achievementData.ts";
import styles from "./ProfileAchievements.module.css";

// ── SIMULACIÓN DE BACKEND ──
const unlockedAchievementIds = [
	"ach_win_unionist",
	"ach_play_10",
	"ach_one_hp_clutch",
];

export default function ProfileAchievements() {
	return (
		<div className={styles.achievementsSection}>
			<p className={styles.sectionLabel}>LOGROS</p>

			<div className={styles.stickersGrid}>
				{ACHIEVEMENTS.map((ach) => {
					const isUnlocked = unlockedAchievementIds.includes(ach.id);

					const displayImage = ach.image;

					if (isUnlocked) {
						return (
							/* ── PEGATINA DESBLOQUEADA ── */
							<div
								key={ach.id}
								className={styles.logroStickerContainer}
								title={ach.technicalDescription}
								style={{ transform: `rotate(${ach.rotation || 0}deg)` }}
							>
								<img
									src={displayImage}
									alt={ach.title}
									className={styles.logroSticker}
								/>
							</div>
						);
					} else {
						return (
							/* ── PEGATINA BLOQUEADA ── */
							<div
								key={`locked-${ach.id}`}
								className={styles.lockedStickerContainer}
								title={ach.technicalDescription}
								style={{ transform: `rotate(${ach.rotation || 0}deg)` }}
							>
								<img
									src={displayImage}
									alt="Bloqueado"
									className={styles.lockedSticker}
								/>
								{/* Overlay con la interrogación en hover */}
								<div className={styles.lockedOverlay}>
									<span>?</span>
								</div>
							</div>
						);
					}
				})}
			</div>
		</div>
	);
}
