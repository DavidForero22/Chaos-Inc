// src/components/profile/ProfileAchievements.tsx

import { useEffect, useState } from "react";
import { ACHIEVEMENTS, type Achievement } from "../../data/achievements.ts";
import type { UserAchievement } from "../../types/api.ts";
import styles from "./ProfileAchievements.module.css";

interface ProfileAchievementsProps {
	userAchievements?: UserAchievement[];
}

export default function ProfileAchievements({
	userAchievements = [],
}: ProfileAchievementsProps) {
	// Estado para controlar el modal
	const [selectedAchievement, setSelectedAchievement] =
		useState<Achievement | null>(null);

	const getImagePath = (path: string) =>
		path.startsWith("/") ? path : `/${path}`;

	const unlockedMap = new Map<string, string>();
	userAchievements.forEach((ach) => {
		unlockedMap.set(String(ach.id), ach.unlockedAt);
	});

	const isAchievementUnlocked = (id: string) => unlockedMap.has(String(id));

	const formatUnlockDate = (dateString?: string) => {
		if (!dateString) return "FECHA DESCONOCIDA";
		const d = new Date(dateString);
		return d.toLocaleString("es-ES", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

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
					const isUnlocked = isAchievementUnlocked(ach.id);
					const displayImage = getImagePath(ach.image);

					if (isUnlocked) {
						return (
							/* ── PEGATINA DESBLOQUEADA ── */
							<div
								key={ach.id}
								className={styles.achStickerContainer}
								title={ach.technicalDescription}
								onClick={() => setSelectedAchievement(ach)}
							>
								<img
									src={getImagePath(ach.image)}
									alt={ach.title}
									className={styles.achSticker}
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
								onClick={() => setSelectedAchievement(ach)}
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
									className={
										isAchievementUnlocked(selectedAchievement.id)
											? styles.modalIcon
											: `${styles.modalIcon} ${styles.lockedSticker}`
									}
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
								{isAchievementUnlocked(selectedAchievement.id)
									? formatUnlockDate(unlockedMap.get(selectedAchievement.id))
									: "Sin desbloquear"}
							</p>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
