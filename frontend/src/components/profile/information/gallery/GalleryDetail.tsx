// src/components/profile/gallery/GalleryDetail.tsx

import type {
	EnrichedCard,
	EnrichedRole,
	EnrichedEnding,
} from "../../../../hooks/profile/useGalleryData.ts";
import styles from "./GalleryDetail.module.css";

interface GalleryDetailProps {
	selectedItem: EnrichedCard | EnrichedRole | EnrichedEnding | undefined;
	isMobile: boolean;
	onBack: () => void;
}

function isEnrichedCard(item: any): item is EnrichedCard {
	return item && item.is_discovered !== undefined;
}

function isEnrichedRole(item: any): item is EnrichedRole {
	return item && item.role !== undefined;
}

function isEnrichedEnding(item: any): item is EnrichedEnding {
	return item && item.ending !== undefined;
}

export default function GalleryDetail({
	selectedItem,
	isMobile,
	onBack,
}: GalleryDetailProps) {
	if (!selectedItem) {
		return (
			<div className={styles.emptyDetail}>
				<div className={styles.emptyStamp}></div>
				<p>Selecciona una pegatina para ver sus detalles</p>
			</div>
		);
	}

	let isUnlocked: boolean;
	let name: string;
	let imageUrl: string | null | undefined;
	let unlockHint: string | undefined;

	// Variables de Cartas
	let description: string | null | undefined;
	let lore: string | null | undefined;
	let timesPlayed: number | undefined;

	// Nuevas variables para Roles y Finales
	let extraLoreText: string | undefined;

	const isCard = isEnrichedCard(selectedItem);

	if (isCard) {
		isUnlocked = selectedItem.is_discovered;
		name = selectedItem.display_name;
		imageUrl = selectedItem.image;
		unlockHint = selectedItem.unlockHint;
		description = selectedItem.description;
		lore = selectedItem.lore;
		timesPlayed = selectedItem.times_played;
	} else if (isEnrichedRole(selectedItem)) {
		isUnlocked = selectedItem.isUnlocked;
		name = selectedItem.label;
		imageUrl = selectedItem.image;
		unlockHint = selectedItem.unlockHint;
		extraLoreText = selectedItem.objective; // Extraemos el objetivo del rol
	} else {
		isUnlocked = selectedItem.isUnlocked;
		name = selectedItem.name;
		imageUrl = selectedItem.image;
		unlockHint = selectedItem.unlockHint;
		extraLoreText = selectedItem.description; // Extraemos la descripción del final
	}

	return (
		<div className={styles.detailContainer}>
			{isMobile && (
				<button onClick={onBack} className={styles.mobileBackButton}>
					← Volver al álbum
				</button>
			)}

			<div className={styles.detailHeader}>
				<div
					className={`${styles.detailImageWrapper} ${!isUnlocked ? styles.lockedDetail : ""} ${!isCard ? styles.wideImage : ""}`}
				>
					{isUnlocked && imageUrl ? (
						<img src={imageUrl} alt={name} className={styles.detailImage} />
					) : (
						<div className={styles.missingSilhouetteLarge}>?</div>
					)}
				</div>
				<h3 className={styles.detailTitle}>
					{isUnlocked ? name : "Desconocido"}
				</h3>
			</div>

			<div className={styles.detailBody}>
				{!isUnlocked ? (
					<div className={styles.hintBox}>
						<strong>Pista de desbloqueo:</strong>
						<p>{unlockHint || "Sigue jugando para descubrir este elemento."}</p>
					</div>
				) : (
					<>
						{isCard && (
							<div className={styles.cardInfo}>
								<p className={styles.description}>{description}</p>
								<div className={styles.separator}></div>
								<p className={styles.lore}>{lore}</p>
								<div className={styles.stats}>
									<span>
										Veces jugada: <strong>{timesPlayed}</strong>
									</span>
								</div>
							</div>
						)}
						{isEnrichedRole(selectedItem) && (
							<div className={styles.infoBlock}>
								<p className={styles.infoBlockTitle}>
									Rol descubierto.
								</p>
								<div className={styles.separator}></div>
								<p className={styles.extraLoreText}>{extraLoreText}</p>
								<div className={styles.separator}></div>
								<p className={styles.acknowledgments}>Agradecimientos a mi amigo Danitron</p>
							</div>
						)}
						{isEnrichedEnding(selectedItem) && (
							<div className={styles.infoBlock}>
								<p className={styles.infoBlockTitle}>
									Final descubierto.
								</p>
								<div className={styles.separator}></div>
								<p className={styles.extraLoreText}>{extraLoreText}</p>
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
}
