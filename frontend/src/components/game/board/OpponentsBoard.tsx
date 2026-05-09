// src/components/game/board/OpponentsBoard.tsx

import { useState, useEffect } from "react";
import { useGameStore } from "../../../store/useGameStore.ts";
import { useGameUIStore } from "../../../store/useGameUIStore.ts";
import { useAuth } from "../../../hooks/useAuth.ts";
import { OpponentCard } from "./OpponentCard.tsx";
import type { Opponent, CardInstance } from "../../../types/live-game.ts";

interface OpponentsBoardProps {
	turnTimeLeft: number | null;
	isTurnPaused?: boolean;
}

export function OpponentsBoard({
	turnTimeLeft,
	isTurnPaused,
}: OpponentsBoardProps) {
	const { id: myId } = useAuth();

	const gameData = useGameStore((state) => state.gameData);
	const playTurn = useGameStore((state) => state.playTurn);

	const { selectedCardId, setSelectedCardId, isFolderExpanded } =
		useGameUIStore();

	// Guardamos el ancho para los rangos manuales. PC ahora es estrictamente >= 1050
	const [screenWidth, setScreenWidth] = useState(window.innerWidth);
	const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1050);
	const [isShortScreen, setIsShortScreen] = useState(window.innerHeight < 565);

	useEffect(() => {
		const handleResize = () => {
			setScreenWidth(window.innerWidth);
			setIsDesktop(window.innerWidth >= 1050); // Forzado a 1000px, adiós al salto raro de Tailwind
			setIsShortScreen(window.innerHeight < 565);
		};

		handleResize();
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	if (!gameData || !myId) return null;

	const { me, game } = gameData;
	const { opponents, current_turn } = game;
	const isMyTurn = String(current_turn) === String(myId);

	const selectedCard =
		me.cards.find((c: CardInstance) => c.id === selectedCardId) ?? null;
	const isTargetingCard = selectedCard?.target === "opponent";

	const handleAction = async (
		targetId: string,
		isOnline: boolean,
		perkKey?: string,
	) => {
		if (!isMyTurn || !selectedCardId || !isOnline) return;
		const success = await playTurn(selectedCardId, targetId, perkKey);
		if (success) {
			setSelectedCardId(null);
		}
	};

	// --- LÓGICA DINÁMICA DE ESCALADO Y POSICIÓN (MANUAL) ---
	let scaleClass = "scale-100";
	let translateClass = "translate-y-0";
	let gapClass = "gap-3 sm:gap-6";

	if (!isDesktop) {
		// Reducimos el espacio entre cartas si hay muchos oponentes o es pantalla estrecha
		if (opponents.length >= 4 || screenWidth < 800) {
			gapClass = "gap-1 sm:gap-2";
		}

		// 1. Definimos el escalado base exacto según tus medidas (cubriendo todos los rangos)
		let currentScaleClosed = "scale-100";
		let currentScaleOpen = "scale-75";

		if (screenWidth >= 900 && screenWidth < 1050) {
			currentScaleClosed = "scale-[0.85]";
			currentScaleOpen = "scale-[0.75]";
		} else if (screenWidth >= 800 && screenWidth < 900) {
			currentScaleClosed = "scale-[0.80]";
			currentScaleOpen = "scale-[0.70]";
		} else if (screenWidth >= 700 && screenWidth < 800) {
			currentScaleClosed = "scale-[0.75]";
			currentScaleOpen = "scale-[0.65]";
		} else if (screenWidth >= 600 && screenWidth < 700) {
			// Escalado extra pequeño para móviles normales
			currentScaleClosed = "scale-[0.65]";
			currentScaleOpen = "scale-[0.55]";
		} else if (screenWidth < 600) {
			// Escalado extremo para el iPhone SE o ventanas muy reducidas
			currentScaleClosed = "scale-[0.55]";
			currentScaleOpen = "scale-[0.45]";
		}

		// 2. Aplicamos la lógica de la carpeta y la altura
		if (isShortScreen) {
			if (isFolderExpanded) {
				scaleClass = currentScaleOpen;
				translateClass = "-translate-y-8";
			} else {
				scaleClass = currentScaleClosed;
				translateClass = "translate-y-10";
			}
		} else {
			// Si la pantalla es alta, SÍ usamos el escalado del ancho, pero no subimos/bajamos tanto
			scaleClass = isFolderExpanded ? currentScaleOpen : currentScaleClosed;
			translateClass = "translate-y-2";
		}
	} else {
		// Ajuste general para PC (>= 1000px)
		scaleClass = "scale-100";
		translateClass = "translate-y-4";
		gapClass = "gap-8";
	}

	const containerClasses = `${scaleClass} ${translateClass} ${gapClass}`;

	return (
		<div className="absolute inset-0 pointer-events-none z-20">
			{/* Mensaje flotante de apuntado */}
			{isMyTurn && isTargetingCard && (
				<div className="absolute top-16 lg:top-10 left-1/2 -translate-x-1/2 bg-yellow-500/90 text-black px-6 py-2 rounded shadow-lg font-bold animate-bounce z-30 border-2 border-black pointer-events-auto text-sm lg:text-base whitespace-nowrap">
					{selectedCard?.card_id === 12
						? "¡Elige una pasiva de un rival!"
						: "¡Elige a un jugador objetivo!"}
				</div>
			)}

			<div
				// Aquí eliminé las clases 'lg:top-12', 'lg:inset-0' y 'lg:h-[50vh]' de Tailwind.
				// Ahora el contenedor aplica sus estilos estrictamente si isDesktop (>= 1050) es true.
				className={`w-full absolute flex items-center justify-center transition-all duration-500 origin-center pointer-events-none ${
					isDesktop ? "top-12 inset-0 h-[50vh]" : "top-0 h-[calc(100dvh-25vh)]"
				} ${containerClasses}`}
			>
				{opponents.map((player: Opponent, index: number) => {
					const total = opponents.length;
					const isBoss = player.role === "boss";

					let inlineStyles: React.CSSProperties = {};

					// Efecto Abanico Suave (Arco Plano) solo en Escritorio (>= 1000px)
					if (isDesktop) {
						const centerIndex = (total - 1) / 2;
						const offset = index - centerIndex;

						const yTranslation = Math.pow(offset, 2) * 5;
						const rotation = offset * 3;

						inlineStyles = {
							transform: `translateY(${yTranslation}px) rotate(${rotation}deg)`,
							transition: "transform 0.3s ease-out",
						};
					}

					return (
						<div
							key={player.id}
							className={`relative pointer-events-auto ${isBoss ? "z-50" : "z-10"}`}
							style={inlineStyles}
						>
							<OpponentCard
								player={player}
								isMyTurn={isMyTurn}
								selectedCard={selectedCard}
								onAction={handleAction}
								turnTimeLeft={turnTimeLeft}
								isTurnPaused={isTurnPaused}
							/>
						</div>
					);
				})}
			</div>
		</div>
	);
}
