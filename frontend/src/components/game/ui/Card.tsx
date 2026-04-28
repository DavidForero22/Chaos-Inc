// src/components/game/ui/Card.tsx
import { useState } from "react";
import type { CardInstance, CardIconType } from "../../../types/live-game";
import { useGameUIStore } from "../../../store/useGameUIStore";
import { CardInfoModal } from "../overlays/CardInfoModal.tsx";
import styles from "./Card.module.css";

// Iconos
import { GiHealthNormal } from "react-icons/gi";
import { FaFileImage, FaRunning, FaTrash, FaUser } from "react-icons/fa";
import { BsBackpack2Fill } from "react-icons/bs";
import { FaUsers } from "react-icons/fa6";
import { RiSwordFill } from "react-icons/ri";
import { IoIosLock } from "react-icons/io";
import { IoHandLeftSharp } from "react-icons/io5";
import { ImTarget } from "react-icons/im";

// Diccionario para renderizar dinámicamente los iconos que manda el servidor
const ICON_MAP: Record<CardIconType, React.ElementType> = {
	attack: RiSwordFill,
	heal: GiHealthNormal,
	dodge: FaRunning,
	block: IoIosLock,
	steal: IoHandLeftSharp,
	discard: FaTrash,
	perk: BsBackpack2Fill,
	self: FaUser,
	opponent: ImTarget,
	all: FaUsers,
};

interface CardProps {
	card: CardInstance;
	isSelectable?: boolean;
	isSelected?: boolean;
	isHighlighted?: boolean;
	isMarkedForDiscard?: boolean;
	onClick?: () => void;
}

// Función para mapear el color del borde según el TIPO de carta
const getTypeBorderClass = (type: string) => {
	switch (type) {
		case "attack":
			return "border-4 border-red-600 shadow-[0_0_10px_rgba(220,38,38,0.4)]";
		case "heal":
			return "border-4 border-green-600 shadow-[0_0_10px_rgba(22,163,74,0.4)]";
		case "perk":
			return "border-4 border-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.4)]";
		case "default":
		default:
			return "border-4 border-gray-800 shadow-[0_0_10px_rgba(31,41,55,0.4)]";
	}
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

	const typeBorderClass = getTypeBorderClass(card.type);

	return (
		<>
			<div
				className={`${styles.cardWrapper} ${interactableClass} ${stateClass}`}
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
			>
				{/* EL CUERPO DE LA FICHA DE ARCHIVO */}
				<div
					className={`${styles.cardBody} ${typeBorderClass} transition-colors duration-300 relative overflow-hidden`}
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

					{/* Título (Nombre de la variante) */}
					<div
						className={`${styles.cardName} z-10 relative bg-white/80 backdrop-blur-sm px-1 rounded mx-1 mt-1`}
						title={card.name}
					>
						{card.name}
					</div>

					{/* [IMAGEN REAL DE LA CARTA] */}
					<div className="absolute inset-0 z-0 flex items-center justify-center opacity-90">
						{card.image ? (
							<img
								src={`/images/cards/${card.image}`}
								alt={card.name}
								className="w-full h-full object-cover"
							/>
						) : (
							// Fallback en caso de que la carta no tenga imagen asignada aún
							<div className="text-gray-300 flex items-center justify-center h-full w-full bg-gray-100">
								<FaFileImage size={40} />
							</div>
						)}
					</div>

					{/* [ICONOS DE EFECTO */}
					<div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2 z-10">
						{card.icons?.map((iconKey, index) => {
							const IconComponent = ICON_MAP[iconKey];
							if (!IconComponent) return null;

							return (
								<div
									key={`${iconKey}-${index}`}
									className="bg-white/90 p-1.5 rounded-full shadow-sm border border-gray-200 text-gray-800"
									title={`Mecánica: ${iconKey}`}
								>
									<IconComponent size={20} strokeWidth={2.5} />
								</div>
							);
						})}
					</div>

					{/* Overlay de Descarte (Marca de X roja grande) */}
					{isMarkedForDiscard && (
						<div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 bg-white/40 backdrop-blur-[2px]">
							<span className="text-red-600 text-7xl opacity-90 font-black rotate-[-10deg] drop-shadow-lg">
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
