import type {
	EnrichedCard,
	EnrichedEnding,
	EnrichedExtra,
	EnrichedRole,
} from "../../../../types/gallery";
import styles from "./GalleryGrid.module.css";

type TabId = "cards" | "roles" | "endings" | "extras";

interface GalleryGridProps {
	activeTab: TabId;
	cards: EnrichedCard[];
	roles: EnrichedRole[];
	endings: EnrichedEnding[];
	extras: EnrichedExtra[];
	selectedItemId: string | number | null;
	onItemClick: (id: string | number) => void;
}

// Type guards
function isEnrichedCard(item: any): item is EnrichedCard {
	return item && item.is_discovered !== undefined;
}

function isEnrichedRole(item: any): item is EnrichedRole {
	return item && item.role !== undefined;
}

function isEnrichedEnding(item: any): item is EnrichedEnding {
	return item && item.ending !== undefined;
}

export default function GalleryGrid({
	activeTab,
	cards,
	roles,
	endings,
	extras,
	selectedItemId,
	onItemClick,
}: GalleryGridProps) {
	let items: (EnrichedCard | EnrichedRole | EnrichedEnding | EnrichedExtra)[] =
		[];
	if (activeTab === "cards") items = cards;
	else if (activeTab === "roles") items = roles;
	else if (activeTab === "endings") items = endings;
	else items = extras;

	const gridClass = activeTab === "cards" ? styles.cardsGrid : styles.wideGrid;

	// Conteo de desbloqueados
	const unlockedCount = items.filter((item) => {
		if (isEnrichedCard(item)) return item.is_discovered;
		if (isEnrichedRole(item)) return item.isUnlocked;
		if (isEnrichedEnding(item)) return item.isUnlocked;
		return (item as EnrichedExtra).is_unlocked;
	}).length;
	const totalCount = items.length;

	return (
		<div className={styles.gridWrapper}>
			<div className={`${styles.gridContainer} ${gridClass}`}>
				{items.map((item) => {
					let id: string | number;
					let isUnlocked: boolean;
					let displayName: string;
					let imageUrl: string | null | undefined;

					if (isEnrichedCard(item)) {
						id = item.id;
						isUnlocked = item.is_discovered;
						displayName = item.display_name;
						imageUrl = `/cards/${item.image_path}`;
					} else if (isEnrichedRole(item)) {
						id = item.role;
						isUnlocked = item.isUnlocked;
						displayName = item.label;
						imageUrl = item.image;
					} else if (isEnrichedEnding(item)) {
						id = item.ending;
						isUnlocked = item.isUnlocked;
						displayName = item.name;
						imageUrl = item.image;
					} else {
						id = item.id;
						isUnlocked = item.is_unlocked;
						displayName = item.name;
						if (item.image) {
							imageUrl = item.image;
						} else if (item.images && item.images.length > 0) {
							imageUrl = item.images[0];
						} else {
							imageUrl = null;
						}
					}

					const isSelected = selectedItemId === id;

					return (
						<button
							key={id}
							className={`${styles.itemWrapper} ${isUnlocked ? styles.unlockedSticker : styles.lockedSlot} ${isSelected ? styles.selectedItem : ""}`}
							onClick={() => onItemClick(id)}
							aria-label={isUnlocked ? displayName : "Elemento bloqueado"}
							aria-pressed={isSelected}
						>
							<div className={styles.itemImageContainer}>
								{isUnlocked ? (
									imageUrl ? (
										<img
											src={imageUrl}
											alt={displayName}
											className={styles.stickerImage}
											loading="lazy"
										/>
									) : (
										<div className={styles.placeholderSticker}>
											{displayName.charAt(0)}
										</div>
									)
								) : (
									<div className={styles.missingSilhouette}>?</div>
								)}
							</div>
							{isUnlocked && (
								<div className={styles.itemName}>{displayName}</div>
							)}
						</button>
					);
				})}
			</div>

			<p className={styles.unlockCounter} aria-live="polite">
				<span className={styles.unlockCountNumber}>{unlockedCount}</span>
				{unlockedCount === 1 ? " desbloqueado de " : " desbloqueados de "}
				<span>{totalCount}</span>
			</p>
		</div>
	);
}
