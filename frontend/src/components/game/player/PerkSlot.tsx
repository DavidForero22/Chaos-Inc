// src/components/game/player/PerkSlot.tsx
// Accesibilidad comprobada: SI

import { useGameUIStore } from "../../../store/game/useGameUIStore";
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

	// Variable auxiliar para simplificar la lógica
	const isDiscardActive = isDiscardMode && !isUnderSabotage;

	let modeClasses = "cursor-help hover:scale-110";

	if (isDiscardActive) {
		modeClasses = isMarked
			? "scale-110 ring-2 ring-red-600 bg-red-100 text-red-600 border-red-600"
			: "hover:scale-110 animate-pulse border-[#295c60] text-[#295c60]";
	}

	const handleClick = () => {
		if (isDiscardActive) {
			toggleDiscardPerk(id);
		} else if (cardType !== undefined && name !== undefined && onInfoClick) {
			onInfoClick(id, cardType, name, title);
		}
	};

	// Etiqueta dinámica para el lector de pantalla según el contexto del juego
	const ariaLabel = isDiscardActive
		? `${isMarked ? "Desmarcar" : "Marcar"} pasiva ${name || title} para descartar`
		: `Ver información de la pasiva: ${name || title}`;

	return (
		<button
			type="button"
			onClick={handleClick}
			aria-label={ariaLabel}
			aria-pressed={isDiscardActive ? isMarked : undefined}
			title={isDiscardActive ? "Marcar esta pasiva para descartar" : title}
			className={`${styles.perkSlot} ${modeClasses} flex items-center justify-center transition-all w-7 h-7 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1`}
		>
			<span aria-hidden="true">{icon}</span>
		</button>
	);
}
