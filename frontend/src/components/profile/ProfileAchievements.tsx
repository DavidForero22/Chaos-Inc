// src/components/profile/ProfileAchievements.tsx

import { useEffect, useState } from "react";
import { ACHIEVEMENTS, type Achievement } from "../../data/achievementData.ts";
import styles from "./ProfileAchievements.module.css";

// ── SIMULACIÓN DE BACKEND ──
const unlockedAchievementIds = [
	"ach_win_unionist",
	"ach_play_10",
	"ach_one_hp_clutch",
];

// Fechas ficticias para los logros desbloqueados
const mockUnlockDates: Record<string, string> = {
	ach_win_unionist: "04/05/2026 - 16:30",
	ach_play_10: "12/05/2026 - 09:15",
	ach_one_hp_clutch: "01/06/2026 - 23:59",
};

export default function ProfileAchievements() {
	// Estado para controlar el modal
	const [selectedAchievement, setSelectedAchievement] =
		useState<Achievement | null>(null);

	const getImagePath = (path: string) =>
		path.startsWith("/") ? path : `/${path}`;

	useEffect(() => {
		if (selectedAchievement) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "auto";
		}

		return () => {
			document.body.style.overflow = "auto";
		};
	}, [selectedAchievement]);

	// Función para cerrar el modal
	const closeModal = () => setSelectedAchievement(null);

	return (
		<div className={styles.achievementsSection}>
			<p className={styles.sectionLabel}>LOGROS</p>

			<div className={styles.stickersGrid}>
				{ACHIEVEMENTS.map((ach) => {
					const isUnlocked = unlockedAchievementIds.includes(ach.id);
					const displayImage = ach.image.startsWith("/")
						? ach.image
						: `/${ach.image}`;

					if (isUnlocked) {
						return (
							/* ── PEGATINA DESBLOQUEADA ── */
							<div
								key={ach.id}
								className={styles.logroStickerContainer}
								title={ach.technicalDescription}
								style={{ transform: `rotate(${ach.rotation || 0}deg)` }}
								onClick={() => setSelectedAchievement(ach)}
							>
								<img
									src={getImagePath(ach.image)}
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
								<div className={styles.lockedOverlay}>
									<span>?</span>
								</div>
							</div>
						);
					}
				})}
			</div>

			{/* ── MODAL DE DETALLES DEL LOGRO ── */}
			{selectedAchievement && (
				<div className={styles.modalOverlay} onClick={closeModal}>
					{/* e.stopPropagation() evita que al hacer clic dentro del modal, este se cierre */}
					<div
						className={styles.modalContent}
						onClick={(e) => e.stopPropagation()}
					>
						<button className={styles.closeButton} onClick={closeModal}>
							✖
						</button>

						<div className={styles.modalHeader}>
							<div className={styles.modalIconWrapper}>
								<img
									src={getImagePath(selectedAchievement.image)}
									alt={selectedAchievement.title}
									className={styles.modalIcon}
								/>
							</div>
							<div className={styles.modalTextInfo}>
								<h3 className={styles.modalTitle}>
									{selectedAchievement.title}
								</h3>
								<p className={styles.modalDescription}>
									{selectedAchievement.technicalDescription}
								</p>
							</div>
						</div>

						<div className={styles.modalBody}>
							<p className={styles.modalLore}>"{selectedAchievement.lore}"</p>
							<p className={styles.modalDate}>
								REGISTRADO:{" "}
								{mockUnlockDates[selectedAchievement.id] || "FECHA DESCONOCIDA"}
							</p>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
