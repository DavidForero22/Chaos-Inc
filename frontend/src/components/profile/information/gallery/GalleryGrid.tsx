import type {
	EnrichedCard,
	EnrichedEnding,
	EnrichedRole,
} from "../../../../types/gallery";
import styles from "./GalleryGrid.module.css";

type TabId = "cards" | "roles" | "endings";

interface GalleryGridProps {
	activeTab: TabId;
	cards: EnrichedCard[];
	roles: EnrichedRole[];
	endings: EnrichedEnding[];
	selectedItemId: string | number | null;
	onItemClick: (id: string | number) => void;
}

function isEnrichedCard(item: any): item is EnrichedCard {
	return item && item.is_discovered !== undefined;
}

function isEnrichedRole(item: any): item is EnrichedRole {
	return item && item.role !== undefined;
}

export default function GalleryGrid({
	activeTab,
	cards,
	roles,
	endings,
	selectedItemId,
	onItemClick,
}: GalleryGridProps) {
	let items: (EnrichedCard | EnrichedRole | EnrichedEnding)[] = [];
	if (activeTab === "cards") items = cards;
	else if (activeTab === "roles") items = roles;
	else items = endings;

	const gridClass = activeTab === "cards" ? styles.cardsGrid : styles.wideGrid;

	return (
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
				} else {
					id = item.ending;
					isUnlocked = item.isUnlocked;
					displayName = item.name;
					imageUrl = item.image;
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
						<div
							className={`
								${styles.itemImageContainer} 
								${
									isUnlocked && isEnrichedCard(item)
										? {
												attack:
													"border-4 border-[#D32F2F] shadow-[0_0_12px_rgba(211,47,47,0.4)]",
												heal: "border-4 border-[#2E7D32] shadow-[0_0_12px_rgba(46,125,50,0.4)]",
												perk: "border-4 border-[#F9A825] shadow-[0_0_12px_rgba(249,168,37,0.4)]",
												default:
													"border-4 border-[#455A64] shadow-[0_0_12px_rgba(69,90,100,0.4)]",
											}[item.type || "default"]
										: ""
								}`}
							>
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
						{isUnlocked && <div className={styles.itemName}>{displayName}</div>}
					</button>
				);
			})}
		</div>
	);
}
