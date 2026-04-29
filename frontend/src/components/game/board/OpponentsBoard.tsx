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
	const { user } = useAuth();

	const gameData = useGameStore((state) => state.gameData);
	const playTurn = useGameStore((state) => state.playTurn);

	const { selectedCardId, setSelectedCardId, isFolderExpanded } =
		useGameUIStore();

	// Estados para controlar el tamaño de la pantalla
	const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
	const [isShortScreen, setIsShortScreen] = useState(window.innerHeight < 565);

	useEffect(() => {
		const handleResize = () => {
			setIsDesktop(window.innerWidth >= 1024);
			setIsShortScreen(window.innerHeight < 565); // Detectar altura
		};
		handleResize();
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	if (!gameData || !user) return null;

	const { me, game } = gameData;
	const { opponents, current_turn } = game;
	const isMyTurn = current_turn === user;

	const selectedCard =
		me.cards.find((c: CardInstance) => c.id === selectedCardId) ?? null;
	const isTargetingCard = selectedCard?.target === "opponent";

	const handleAction = async (
		targetName: string,
		isOnline: boolean,
		perkKey?: string,
	) => {
		if (!isMyTurn || !selectedCardId || !isOnline) return;
		const success = await playTurn(selectedCardId, targetName, perkKey);
		if (success) {
			setSelectedCardId(null);
		}
	};

	// Lógica dinámica de clases para pantallas pequeñas
	const mobileContainerClasses =
		isShortScreen && !isDesktop
			? isFolderExpanded
				? "scale-75 -translate-y-8" // Carpeta abierta: Se encoge y sube
				: "scale-100 translate-y-10" // Carpeta cerrada: Se hace grande y baja
			: "scale-100"; // Comportamiento normal en pantallas altas

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
				// Contenedor dinámico: calc(100dvh - 25vh)
				className={`w-full absolute top-0 lg:top-2 lg:inset-0 h-[calc(100dvh-25vh)] lg:h-auto flex items-center justify-center gap-3 sm:gap-6 lg:block transition-all duration-500 origin-center pointer-events-none ${mobileContainerClasses}`}
			>
				{opponents.map((player: Opponent, index: number) => {
					const total = opponents.length;
					const isBoss = player.role === "boss";

					let inlineStyles: React.CSSProperties = {};

					if (isDesktop) {
						const maxAngle = 70;
						const angleDeg =
							total === 1
								? 0
								: -maxAngle + (index * (maxAngle * 2)) / (total - 1);
						const angleRad = angleDeg * (Math.PI / 180);
						const radius = 380;

						const x = Math.sin(angleRad) * radius;
						const y = -Math.cos(angleRad) * radius;

						inlineStyles = {
							position: "absolute",
							top: "45%",
							left: "50%",
							transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(${angleDeg * 0.3}deg)`,
						};
					}

					return (
						<div
							key={player.name}
							className={`relative pointer-events-auto transition-transform duration-300 ${isBoss ? "z-50" : "z-10"}`}
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
