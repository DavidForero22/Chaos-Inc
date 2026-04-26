// src/components/game/player/PerkSlot.tsx

import { useGameUIStore } from "../../../store/useGameUIStore";
import styles from "./PlayerStats.module.css";

interface PerkSlotProps {
	id: string;
	icon: string;
	title: string;
	cardType?: number;
	name?: string;
	isUnderSabotage?: boolean;
	onInfoClick?: (
		id: string,
		type: number,
		name: string,
		description: string,
	) => void;
}

export function PerkSlot({
	id,
	icon,
	title,
	cardType,
	name,
	isUnderSabotage = false,
	onInfoClick,
}: PerkSlotProps) {
	const { isDiscardMode, perksToDiscard, toggleDiscardPerk } = useGameUIStore();
	const isMarked = perksToDiscard.includes(id);

	let modeClasses = "cursor-help hover:scale-110";

	// Si esta en modo descarte y no es un sabotaje (donde solo se descartan cartas)
	if (isDiscardMode && !isUnderSabotage) {
		modeClasses = isMarked
			? "cursor-pointer scale-110 ring-2 ring-red-600 bg-red-100 text-red-600 border-red-600"
			: "cursor-pointer hover:scale-110 animate-pulse border-[#295c60] text-[#295c60]";
	}

	return (
		<span
			title={
				isDiscardMode && !isUnderSabotage
					? "Marcar esta pasiva para descartar"
					: title
			}
			className={`${styles.perkSlot} ${modeClasses} transition-all w-7 h-7 text-sm`}
			onClick={() => {
				if (isDiscardMode && !isUnderSabotage) {
					toggleDiscardPerk(id);
				} else if (
					cardType !== undefined &&
					name !== undefined &&
					onInfoClick
				) {
					onInfoClick(id, cardType, name, title);
				}
			}}
		>
			{icon}
		</span>
	);
}
