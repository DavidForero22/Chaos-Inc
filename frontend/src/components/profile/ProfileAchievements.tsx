// src/components/profile/ProfileAchievements.tsx

import styles from "./ProfileAchievements.module.css";

// Imagina que en el futuro esto viene del backend: games.achievements o similar
const mockAchievements = [
	{
		id: "ach_01",
		name: "Ganar como Sindicalista",
		image: "/image_5c7c12.png", // Asegúrate de tener la imagen en la carpeta public/
		rotation: -2, // Rotación aleatoria para dar el toque manual
	},
];

// Generamos slots vacíos para que parezca un álbum
const totalSlots = 6;
const emptySlots = Array.from({
	length: Math.max(0, totalSlots - mockAchievements.length),
});

export default function ProfileAchievements() {
	return (
		<div className={styles.achievementsSection}>
			<p className={styles.sectionLabel}>
				LOGROS
			</p>

			<div className={styles.stickersGrid}>
				{/* ── PEGATINAS DESBLOQUEADAS ── */}
				{mockAchievements.map((ach) => (
					<div
						key={ach.id}
						className={styles.logroStickerContainer}
						title={ach.name}
						style={{ transform: `rotate(${ach.rotation}deg)` }}
					>
						<img
							src={ach.image}
							alt={ach.name}
							className={styles.logroSticker}
						/>
					</div>
				))}

				{/* ── HUECOS VACÍOS (Aún por desbloquear) ── */}
				{emptySlots.map((_, index) => (
					<div
						key={`empty-${index}`}
						className={styles.emptySlot}
						title="Mérito no desbloqueado"
					>
						<span className={styles.emptyQuestion}>?</span>
					</div>
				))}
			</div>
		</div>
	);
}
