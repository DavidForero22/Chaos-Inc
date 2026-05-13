// src/components/game/ui/Card.tsx
import { useState } from "react";
import type { CardInstance, CardIconType } from "../../../types/live-game";
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
import { HiUsers } from "react-icons/hi";

import { usePlayerActions } from "../../../hooks/game/usePlayerActions.ts";
import { useGameUIStore } from "../../../store/useGameUIStore.ts";
import { useGameStore } from "../../../store/useGameStore.ts";

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
	opponents: HiUsers,
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
	const [showInfo, setShowInfo] = useState(false);
	const [isHovered, setIsHovered] = useState(false);

	// Estado ara saber si la carta tiene el foco del teclado
	const [isFocused, setIsFocused] = useState(false);

	const { isDiscardMode, isInfoMode } = usePlayerActions();

	let stateClass = "";
	if (isMarkedForDiscard) stateClass = styles.markedForDiscard;
	else if (isSelected && !isDiscardMode && !isInfoMode)
		stateClass = styles.selected;
	else if (isHighlighted && !isDiscardMode && !isInfoMode)
		stateClass = styles.highlighted;
	else if (isDiscardMode && isSelectable) stateClass = styles.discardMode;
	else if (isInfoMode) stateClass = styles.infoMode;

	const isInteractive = isSelectable || isInfoMode;
	const interactableClass = isInteractive
		? styles.interactable
		: styles.notInteractable;
	const typeBorderClass = getTypeBorderClass(card.type);

	const selectedCardId = useGameUIStore((state) => state.selectedCardId);
	const me = useGameStore((state) => state.gameData?.me);
	const isTargetingMode =
		me?.cards.find((c) => c.id === selectedCardId)?.target === "opponent";

	const handleCardClick = () => {
		if (isInfoMode) {
			setShowInfo(true);
		} else if (isSelectable && onClick) {
			onClick();
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (isInteractive && (e.key === "Enter" || e.key === " ")) {
			e.preventDefault();
			handleCardClick();
		}
	};

	const ariaLabel = `${card.name}. ${card.description}. ${isMarkedForDiscard ? "Marcada para descartar." : ""} ${isSelected ? "Seleccionada." : ""}`;

	return (
		<>
			<div
				className={`${styles.cardWrapper} ${interactableClass} ${stateClass}`}
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
				// --- ACCESIBILIDAD: Mantener vivo el botón '?' si el foco está dentro del wrapper ---
				onFocus={() => setIsFocused(true)}
				onBlur={(e) => {
					if (!e.currentTarget.contains(e.relatedTarget)) {
						setIsFocused(false);
					}
				}}
			>
				{/* EL CUERPO DE LA FICHA DE ARCHIVO */}
				<div
					className={`${styles.cardBody} ${typeBorderClass} transition-colors duration-300 relative overflow-hidden flex flex-col focus:outline-none focus:ring-4 focus:ring-blue-500`}
					onClick={isInteractive ? handleCardClick : undefined}
					onKeyDown={handleKeyDown}
					role={isInteractive ? "button" : "article"}
					tabIndex={isTargetingMode ? -1 : isInteractive ? 0 : undefined}
					aria-label={ariaLabel}
					aria-selected={isSelected}
					aria-disabled={!isInteractive}
					title={card.description}
				>
					<div className="w-full h-10 flex items-center justify-center px-1 z-10">
						<div
							className={styles.cardName}
							title={card.name}
							aria-hidden="true"
						>
							{card.name}
						</div>
					</div>

					<div className="w-full h-20 relative shrink-0 border-y-2 border-gray-800/10 flex items-center justify-center overflow-hidden">
						{card.image ? (
							<img
								src={`/cards/${card.image}`}
								alt={card.name}
								draggable={false}
								className="w-full h-full object-cover opacity-95 select-none"
							/>
						) : (
							<div
								className="text-gray-400 flex items-center justify-center h-full w-full bg-gray-200"
								aria-hidden="true"
							>
								<FaFileImage size={24} />
							</div>
						)}
					</div>

					<div className="w-full h-6 shrink-0 flex justify-center items-center mt-1 gap-1 z-10">
						{card.icons?.map((iconKey, index) => {
							const IconComponent = ICON_MAP[iconKey];
							if (!IconComponent) return null;

							return (
								<div
									key={`${iconKey}-${index}`}
									className="text-gray-800 drop-shadow-sm flex items-center justify-center"
									title={`Mecánica: ${iconKey}`}
								>
									<IconComponent size={16} aria-hidden="true" />
								</div>
							);
						})}
					</div>

					{isMarkedForDiscard && (
						<div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 bg-white/40">
							<span
								className="text-red-600 text-6xl opacity-90 font-black rotate-[-10deg] drop-shadow-lg"
								aria-hidden="true"
							>
								✕
							</span>
						</div>
					)}
				</div>

				{(isHovered || isSelected || isFocused) && !isInfoMode && (
					<button
						tabIndex={isTargetingMode ? -1 : 0}
						onClick={(e) => {
							e.stopPropagation();
							setShowInfo(true);
						}}
						className="hidden lg:flex absolute top-1 left-1 w-6 h-6 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-full items-center justify-center z-50 transition cursor-help hover:scale-110 shadow-md border border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1 focus:ring-offset-black"
						title="Ver detalles del documento"
						aria-label={`Ver detalles de ${card.name}`}
					>
						?
					</button>
				)}
			</div>

			{showInfo && (
				<CardInfoModal card={card} onClose={() => setShowInfo(false)} />
			)}
		</>
	);
}
