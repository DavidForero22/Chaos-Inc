import type { CardInstance } from "../../../types/live-game";

interface CardProps {
	card: CardInstance;
	isSelectable?: boolean;
	isSelected?: boolean;
	isHighlighted?: boolean; 
	onClick?: () => void;
}

export function Card({
	card,
	isSelectable = false,
	isSelected = false,
	isHighlighted = false,
	onClick,
}: CardProps) {
	// Definimos los estilos base comunes
	const baseClasses =
		"shrink-0 w-24 h-36 rounded-lg border flex flex-col items-center justify-center shadow-lg transition-all text-center px-2";

	// Determinamos si el usuario puede interactuar con ella
	const interactableClasses = isSelectable
		? "cursor-pointer hover:-translate-y-4"
		: "opacity-40 cursor-not-allowed";

	// Determinamos el color de fondo y borde basado en el estado
	let stateClasses = "bg-gray-700 border-gray-500"; // Por defecto

	if (isSelected) {
		stateClasses =
			"bg-blue-800 border-blue-400 -translate-y-4 shadow-blue-500/50 ring-2 ring-blue-400";
	} else if (isHighlighted) {
		stateClasses =
			"bg-yellow-900/40 border-yellow-400 ring-2 ring-yellow-400 animate-pulse";
	}

	return (
		<div
			onClick={isSelectable ? onClick : undefined}
			className={`${baseClasses} ${interactableClasses} ${stateClasses}`}
			title={card.description}
		>
			<span className="text-sm text-gray-200 font-semibold leading-snug">
				{card.name}
			</span>
		</div>
	);
}
