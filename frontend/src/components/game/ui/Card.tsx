// src/components/game/ui/Card.tsx
import { useState } from "react";
import type { CardInstance } from "../../../types/live-game";
import { useGameUIStore } from "../../../store/useGameUIStore";
import { CardInfoModal } from "../overlays/CardInfoModal.tsx";

interface CardProps {
	card: CardInstance;
	isSelectable?: boolean;
	isSelected?: boolean;
	isHighlighted?: boolean;
	isMarkedForDiscard?: boolean;
	onClick?: () => void;
}

export function Card({
	card,
	isSelectable = false,
	isSelected = false,
	isHighlighted = false,
	isMarkedForDiscard = false,
	onClick,
}: CardProps) {
	const isDiscardMode = useGameUIStore((state) => state.isDiscardMode);
	const [showInfo, setShowInfo] = useState(false);
	const [isHovered, setIsHovered] = useState(false);

	const baseClasses =
		"shrink-0 w-24 h-36 rounded-lg border flex flex-col items-center justify-center shadow-lg transition-all text-center px-2 relative";

	const interactableClasses = isSelectable
		? "cursor-pointer hover:-translate-y-4"
		: "opacity-40 cursor-not-allowed";

	let stateClasses = "bg-gray-700 border-gray-500";

	if (isMarkedForDiscard) {
		stateClasses =
			"bg-red-900/60 border-red-500 -translate-y-2 ring-2 ring-red-500";
	} else if (isSelected) {
		stateClasses =
			"bg-blue-800 border-blue-400 -translate-y-4 shadow-blue-500/50 ring-2 ring-blue-400";
	} else if (isHighlighted) {
		stateClasses =
			"bg-yellow-900/40 border-yellow-400 ring-2 ring-yellow-400 animate-pulse";
	} else if (isDiscardMode && isSelectable) {
		stateClasses =
			"bg-gray-700 border-red-400/50 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.2)]";
	}

	return (
		<>
			<div
				onClick={isSelectable ? onClick : undefined}
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
				className={`${baseClasses} ${interactableClasses} ${stateClasses}`}
				title={card.description}
			>
				{isMarkedForDiscard && (
					<div className="absolute top-1 right-1 text-red-400 text-xs font-black">
						✕
					</div>
				)}

				{/* Botón "?" visible en hover o seleccionada */}
				{(isHovered || isSelected) && (
					<button
						onClick={(e) => {
							e.stopPropagation(); // no propagar al onClick de la carta
							setShowInfo(true);
						}}
						className="absolute top-1 left-1 w-6 h-6 bg-gray-800 hover:bg-gray-600 text-white text-s font-black rounded-full flex items-center justify-center z-10 transition cursor-help hover:scale-110"
						title="Ver más detalles de la carta"
					>
						?
					</button>
				)}

				<span className="text-sm text-gray-200 font-semibold leading-snug">
					{card.name}
				</span>
			</div>

			{showInfo && (
				<CardInfoModal card={card} onClose={() => setShowInfo(false)} />
			)}
		</>
	);
}
