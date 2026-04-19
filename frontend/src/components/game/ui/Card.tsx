// src/components/game/ui/Card.tsx
import { useState } from "react";
import type { CardInstance } from "../../../types/live-game";
import { useGameUIStore } from "../../../store/useGameUIStore";
import { CardInfoModal } from "../overlays/CardInfoModal.tsx";
import styles from "./Card.module.css";

interface CardProps {
	card: CardInstance;
	isSelectable?: boolean;
	isSelected?: boolean;
	isHighlighted?: boolean;
	isMarkedForDiscard?: boolean;
	onClick?: () => void;
}

// Función auxiliar para mapear el diseño (Hasta que el backend envíe las imágenes)
const getCardVisuals = (name: string) => {
	const lowerName = name.toLowerCase();
	if (lowerName.includes("atacar")) return { drawing: "🗜️", icon: "💥" };
	if (lowerName.includes("curar") || lowerName.includes("curación"))
		return { drawing: "🩹", icon: "💖" };
	if (lowerName.includes("esquivar")) return { drawing: "🏃", icon: "🛡️" };
	if (lowerName.includes("robar")) return { drawing: "💵", icon: "🕵️" };
	if (lowerName.includes("limpieza")) return { drawing: "🧹", icon: "✨" };
	if (lowerName.includes("almacen") || lowerName.includes("almacén"))
		return { drawing: "🗄️", icon: "📦" };
	return { drawing: "📄", icon: "⚙️" };
};

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

	// Resolver las clases de estado dinámicas
	let stateClass = "";
	if (isMarkedForDiscard) stateClass = styles.markedForDiscard;
	else if (isSelected && !isDiscardMode) stateClass = styles.selected;
	else if (isHighlighted && !isDiscardMode) stateClass = styles.highlighted;
	else if (isDiscardMode && isSelectable) stateClass = styles.discardMode;

	const interactableClass = isSelectable
		? styles.interactable
		: styles.notInteractable;

	const visuals = getCardVisuals(card.name);

	return (
		<>
			<div
				className={`${styles.cardWrapper} ${interactableClass} ${stateClass}`}
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
			>
				{/* EL CUERPO DE LA FICHA DE ARCHIVO */}
				<div
					className={styles.cardBody}
					onClick={isSelectable ? onClick : undefined}
					title={card.description}
				>
					{/* Botón "?" visible en hover o seleccionada */}
					{(isHovered || isSelected) && (
						<button
							onClick={(e) => {
								e.stopPropagation(); // no propagar al onClick de la carta
								setShowInfo(true);
							}}
							className="absolute top-1 left-1 w-6 h-6 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-full flex items-center justify-center z-50 transition cursor-help hover:scale-110 shadow-md border border-blue-800"
							title="Ver detalles del documento"
						>
							?
						</button>
					)}

					{/* Título */}
					<div className={styles.cardName} title={card.name}>
						{card.name}
					</div>

					{/* [DIBUJO] */}
					<div className={styles.drawingBox}>{visuals.drawing}</div>

					{/* [ICONO EFECTO] */}
					<div className={styles.effectIcon}>{visuals.icon}</div>

					{/* Overlay de Descarte (Marca de X roja grande) */}
					{isMarkedForDiscard && (
						<div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
							<span className="text-red-600 text-7xl opacity-70 font-black rotate-[-10deg]">
								✕
							</span>
						</div>
					)}
				</div>
			</div>

			{showInfo && (
				<CardInfoModal card={card} onClose={() => setShowInfo(false)} />
			)}
		</>
	);
}
