// src/components/profile/gallery/GalleryDetail.tsx

import type {
	EnrichedCard,
	EnrichedEnding,
	EnrichedExtra,
	EnrichedRole,
} from "../../../../types/gallery";
import type { ViewerItem } from "../../../../hooks/profile/useGalleryViewer.ts";
import { CardStamps } from "./CardStamps";
import styles from "./GalleryDetail.module.css";

interface GalleryDetailProps {
	selectedItem:
		| EnrichedCard
		| EnrichedRole
		| EnrichedEnding
		| EnrichedExtra
		| undefined;
	isMobile: boolean;
	onBack: () => void;
	onOpenViewer: (item: ViewerItem) => void;
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

function isEnrichedExtra(item: any): item is EnrichedExtra {
	return item && item.achievements_required !== undefined;
}

export default function GalleryDetail({
	selectedItem,
	isMobile,
	onBack,
	onOpenViewer,
}: GalleryDetailProps) {
	if (!selectedItem) {
		return (
			<div className={styles.emptyDetail}>
				<p>Selecciona un objeto para ver sus detalles</p>
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

	// Variables para Roles y Finales
	let extraLoreText: string | undefined;

	// Para extras
	let images: string[] | null | undefined;
	let hasDocumentPages: boolean = false;

	const isCard = isEnrichedCard(selectedItem);
	const isRole = isEnrichedRole(selectedItem);
	const isEnding = isEnrichedEnding(selectedItem);
	const isExtra = isEnrichedExtra(selectedItem);

	if (isCard) {
		isUnlocked = selectedItem.is_discovered;
		name = selectedItem.display_name;
		imageUrl = `/cards/${selectedItem.image_path}`;
		unlockHint = selectedItem.unlockHint;
		description = selectedItem.description;
		lore = selectedItem.lore;
		timesPlayed = selectedItem.times_played;
	} else if (isRole) {
		isUnlocked = selectedItem.isUnlocked;
		name = selectedItem.label;
		imageUrl = selectedItem.image;
		unlockHint = selectedItem.unlockHint;
		extraLoreText = selectedItem.objective;
	} else if (isEnding) {
		isUnlocked = selectedItem.isUnlocked;
		name = selectedItem.name;
		imageUrl = selectedItem.image;
		unlockHint = selectedItem.unlockHint;
		extraLoreText = selectedItem.description;
	} else {
		// EnrichedExtra
		isUnlocked = selectedItem.is_unlocked;
		name = selectedItem.name;
		images = selectedItem.is_unlocked ? selectedItem.images : null;
		hasDocumentPages = !!(images && images.length > 0);
		imageUrl = selectedItem.is_unlocked
			? hasDocumentPages
				? images![0] // preview de la primera página
				: selectedItem.image
			: null;
		unlockHint = `Consigue ${selectedItem.achievements_required} logros.`;
	}

	// Solo roles, finales y extras desbloqueados abren el visor
	const isViewable = isUnlocked && (isRole || isEnding || isExtra);

	const handleImageClick = () => {
		if (!isViewable) return;
		onOpenViewer(selectedItem as ViewerItem);
	};

	return (
		<div className={styles.detailContainer}>
			{isMobile && (
				<button onClick={onBack} className={styles.mobileBackButton}>
					← Volver al álbum
				</button>
			)}

			<div className={styles.detailHeader}>
				<div
					className={[
						styles.detailImageWrapper,
						!isUnlocked ? styles.lockedDetail : "",
						!isCard ? styles.wideImage : "",
						isViewable ? styles.viewableImage : "",
					]
						.filter(Boolean)
						.join(" ")}
					onClick={handleImageClick}
					role={isViewable ? "button" : undefined}
					tabIndex={isViewable ? 0 : undefined}
					aria-label={isViewable ? `Ver ${name} en grande` : undefined}
					onKeyDown={
						isViewable
							? (e) => e.key === "Enter" && handleImageClick()
							: undefined
					}
				>
					{isUnlocked ? (
						imageUrl ? (
							<>
								<img src={imageUrl} alt={name} className={styles.detailImage} />
								{/* Overlay de hover solo para viewables */}
								{isViewable && (
									<div className={styles.imageHoverOverlay} aria-hidden="true">
										{hasDocumentPages ? "Ver documento" : "Ver imagen"}
									</div>
								)}
							</>
						) : (
							<div className={styles.missingSilhouetteLarge}>?</div>
						)
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
								<CardStamps card={selectedItem} />
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
						{(isRole || isEnding) && (
							<div className={styles.infoBlock}>
								<p className={styles.infoBlockTitle}>
									{isRole ? "Rol descubierto" : "Final descubierto"}
								</p>
								<div className={styles.separator}></div>
								<p className={styles.extraLoreText}>{extraLoreText}</p>
								{isRole && (
									<>
										<div className={styles.separator}></div>
										<p className={styles.acknowledgments}>
											Agradecimientos a mi amigo Danitron
										</p>
									</>
								)}
							</div>
						)}
						{isExtra && (
							<div className={styles.infoBlock}>
								<p className={styles.infoBlockTitle}>Contenido extra</p>
								<div className={styles.separator}></div>
								<p className={styles.extraLoreText}>{selectedItem.description}</p>
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
}
