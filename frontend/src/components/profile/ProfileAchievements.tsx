// src/components/profile/ProfileAchievements.tsx
// Accesibilidad comprobada: SI

import { useEffect, useState, useRef } from "react";
import {
	ACHIEVEMENTS,
	type Achievement,
	type UnactiveAchievement,
} from "../../data/achievements.ts";
import type { UserAchievement } from "../../types/api.ts";
import styles from "./ProfileAchievements.module.css";
import viewStyles from "./RegisteredProfileView.module.css";

interface ProfileAchievementsProps {
	userAchievements?: UserAchievement[];
}

export default function ProfileAchievements({
	userAchievements = [],
}: ProfileAchievementsProps) {
	// Estado para controlar el modal
	const [selectedAchievement, setSelectedAchievement] =
		useState<Achievement | null>(null);

	// Referencia para el botón que abrió el modal (para restaurar el foco al cerrar)
	const lastFocusedElementRef = useRef<HTMLElement | null>(null);

	const getImagePath = (path: string) =>
		path.startsWith("/") ? path : `/${path}`;

	const unactiveAch: UnactiveAchievement = {
		title: "Próximamente...",
		technicalDescription: "¡Estamos trabajando en ello!",
		image: "/achievements/ach_placeholder.png",
	};

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
			// Guardar el elemento que tenía el foco
			lastFocusedElementRef.current = document.activeElement as HTMLElement;
			document.body.style.overflow = "hidden";
			// Añadir atributo ARIA para lectores de pantalla
			document.body.setAttribute("aria-hidden", "true");
		} else {
			document.body.style.overflow = "auto";
			document.body.removeAttribute("aria-hidden");
			// Restaurar el foco al elemento que abrió el modal
			if (lastFocusedElementRef.current) {
				lastFocusedElementRef.current.focus();
			}
		}

		return () => {
			document.body.style.overflow = "auto";
			document.body.removeAttribute("aria-hidden");
		};
	}, [selectedAchievement]);

	// Función para cerrar el modal
	const closeModal = () => setSelectedAchievement(null);

	// Manejar tecla Escape para cerrar el modal
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Escape" && selectedAchievement) {
			closeModal();
		}
	};

	return (
		<section aria-labelledby="achievements-heading" onKeyDown={handleKeyDown}>
			<h1 id="achievements-heading" className={viewStyles.sectionLabel}>
				LOGROS
			</h1>

			<div className={styles.achievementsSection}>
				<div
					className={styles.stickersGrid}
					role="list"
					aria-label="Lista de logros"
				>
					{ACHIEVEMENTS.map((ach) => {
						const isUnlocked = isAchievementUnlocked(ach.id);
						const displayImage = getImagePath(ach.image);
						const isActive = ach.active;

						const title = isActive ? ach.title : unactiveAch.title;
						const description = isActive
							? ach.technicalDescription
							: unactiveAch.technicalDescription;
						const statusText = isUnlocked ? "desbloqueado" : "bloqueado";

						if (isUnlocked) {
							return (
								/* ── PEGATINA DESBLOQUEADA ── */
								<div
									key={ach.id}
									role="listitem"
									className={styles.achStickerContainer}
								>
									<button
										onClick={() => setSelectedAchievement(ach)}
										className={styles.achStickerButton}
										aria-label={`Ver detalles de ${title}, ${statusText}`}
										aria-describedby={`achievement-desc-${ach.id}`}
										title={description}
									>
										<img
											src={getImagePath(displayImage)}
											alt=""
											aria-hidden="true"
											className={styles.achSticker}
										/>
										<span className="visually-hidden">{title}</span>
									</button>
									<div
										id={`achievement-desc-${ach.id}`}
										className="visually-hidden"
									>
										{description}
									</div>
								</div>
							);
						} else {
							return (
								/* ── PEGATINA BLOQUEADA ── */
								<div
									key={`locked-${ach.id}`}
									role="listitem"
									className={styles.lockedStickerContainer}
								>
									<button
										onClick={() => setSelectedAchievement(ach)}
										className={styles.lockedStickerButton}
										aria-label={`${title}, ${statusText}. ${description}`}
										title={description}
									>
										<img
											src={
												isActive
													? getImagePath(displayImage)
													: unactiveAch.image
											}
											alt=""
											aria-hidden="true"
											className={styles.lockedSticker}
										/>
										<div className={styles.lockedOverlay} aria-hidden="true">
											<span>🔒</span>
										</div>
										<span className="visually-hidden">{title} (bloqueado)</span>
									</button>
								</div>
							);
						}
					})}
				</div>

				{/* ── MODAL DE DETALLES DEL LOGRO ── */}
				{selectedAchievement && (
					<div
						className={styles.modalOverlay}
						onClick={closeModal}
						role="dialog"
						aria-modal="true"
						aria-labelledby="modal-title"
						aria-describedby="modal-description"
					>
						<div
							className={styles.modalContent}
							onClick={(e) => e.stopPropagation()}
							role="document"
						>
							<button
								className={styles.closeButton}
								onClick={closeModal}
								aria-label="Cerrar diálogo de logro"
							>
								<span aria-hidden="true">✖</span>
								<span className="visually-hidden">Cerrar</span>
							</button>

							<div className={styles.modalHeader}>
								<div className={styles.modalIconWrapper}>
									<img
										src={getImagePath(selectedAchievement.image)}
										alt=""
										aria-hidden="true"
										className={
											isAchievementUnlocked(selectedAchievement.id) ||
											!selectedAchievement.active
												? styles.modalIcon
												: `${styles.lockedSticker}`
										}
									/>
								</div>
								<div className={styles.modalTextInfo}>
									<h3 id="modal-title" className={styles.modalTitle}>
										{selectedAchievement.active
											? selectedAchievement.title
											: unactiveAch.title}
									</h3>
									<p id="modal-description" className={styles.modalDescription}>
										{selectedAchievement.active
											? selectedAchievement.technicalDescription
											: unactiveAch.technicalDescription}
									</p>
								</div>
							</div>

							{selectedAchievement.active && (
								<div className={styles.modalBody}>
									<p className={styles.modalLore}>
										"{selectedAchievement.lore}"
									</p>
									<p className={styles.modalDate}>
										<strong>DESBLOQUEADO:</strong>{" "}
										{isAchievementUnlocked(selectedAchievement.id)
											? formatUnlockDate(
													unlockedMap.get(selectedAchievement.id),
												)
											: "Por descubrir"}
									</p>
								</div>
							)}
						</div>
					</div>
				)}
			</div>
		</section>
	);
}
