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
			// Rojo Carmesí: Alerta y urgencia
			return "!border-4 !border-[#D32F2F] shadow-[0_0_12px_rgba(211,47,47,0.4)]";
		case "heal":
			// Verde Esmeralda (ligeramente azulado): Restauración segura
			return "!border-4 !border-[#2E7D32] shadow-[0_0_12px_rgba(46,125,50,0.4)]";
		case "perk":
			// Ámbar/Oro: Especialización y valor
			return "!border-4 !border-[#F9A825] shadow-[0_0_12px_rgba(249,168,37,0.4)]";
		case "default":
		default:
			// Azul Cobalto/Slate: Utilidad burocrática y orden
			return "!border-4 !border-[#455A64] shadow-[0_0_12px_rgba(69,90,100,0.4)]";
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
					className={`${styles.cardBody} ${typeBorderClass} transition-colors duration-300 relative overflow-hidden flex flex-col`}
					onClick={isSelectable ? onClick : undefined}
					title={card.description}
				>
					{/* Botón "?" visible en hover o seleccionada */}
					{(isHovered || isSelected) && (
						<button
							onClick={(e) => {
								e.stopPropagation();
								setShowInfo(true);
							}}
							className="absolute top-1 left-1 w-6 h-6 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-full flex items-center justify-center z-50 transition cursor-help hover:scale-110 shadow-md border border-blue-800"
							title="Ver detalles del documento"
						>
							?
						</button>
					)}

					{/* 1. CABECERA: Título (Formato BANG!) */}
					<div className="w-full grow flex items-center justify-center px-1 pt-1 pb-1 z-10">
						<div className={styles.cardName} title={card.name}>
							{card.name}
						</div>
					</div>

					{/* 2. MEDIO: Imagen (Ahora Rectangular y más baja) */}
					{/* h-[80px] hace la imagen rectangular y reduce la altura total */}
					<div className="w-full h-20 relative shrink-0 bg-gray-900 border-y-2 border-gray-800/10 flex items-center justify-center overflow-hidden">
						{card.image ? (
							<img
								src={`/images/cards/${card.image}`}
								alt={card.name}
								className="w-full h-full object-cover opacity-95"
							/>
						) : (
							<div className="text-gray-400 flex items-center justify-center h-full w-full bg-gray-200">
								<FaFileImage size={24} />
							</div>
						)}
					</div>

					{/* 3. PIE: Iconos (Abajo, sin círculo) */}
					<div className="w-full h-6 shrink-0 flex justify-center items-center gap-1 z-10 ">
						{card.icons?.map((iconKey, index) => {
							const IconComponent = ICON_MAP[iconKey];
							if (!IconComponent) return null;

							return (
								<div
									key={`${iconKey}-${index}`}
									className="text-gray-800 drop-shadow-sm flex items-center justify-center"
									title={`Mecánica: ${iconKey}`}
								>
									<IconComponent size={16} />
								</div>
							);
						})}
					</div>

					{/* Overlay de Descarte (Marca de X roja grande) */}
					{isMarkedForDiscard && (
						<div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 bg-white/40">
							<span className="text-red-600 text-6xl opacity-90 font-black rotate-[-10deg] drop-shadow-lg">
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
