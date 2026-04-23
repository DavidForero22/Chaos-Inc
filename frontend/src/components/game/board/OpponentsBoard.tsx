// src/components/game/board/OpponentsBoard.tsx

import { useGameStore } from "../../../store/useGameStore.ts";
import { useGameUIStore } from "../../../store/useGameUIStore.ts";
import { useAuth } from "../../../hooks/useAuth.ts";
import { OpponentCard } from "./OpponentCard.tsx";
import { SELF_TARGET_CARDS } from "../../../hooks/game/usePlayerActions.ts";
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
	const { selectedCardId, setSelectedCardId } = useGameUIStore();

	if (!gameData || !user) return null;

	const { me, game } = gameData;
	const { opponents, current_turn } = game;
	const isMyTurn = current_turn === user;

	const selectedCardType =
		me.cards.find((c: CardInstance) => c.id === selectedCardId)?.type ?? null;
	const isTargetingCard =
		selectedCardType !== null && !SELF_TARGET_CARDS.includes(selectedCardType);

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

	return (
		// Cubre toda la pantalla por debajo del UI, centramos el origen de coordenadas
		<div className="absolute inset-0 pointer-events-none z-20">
			{isMyTurn && isTargetingCard && (
				<div className="absolute top-10 left-1/2 -translate-x-1/2 bg-yellow-500/90 text-black px-6 py-2 rounded shadow-lg font-bold animate-bounce z-30 border-2 border-black pointer-events-auto">
					{selectedCardType === 12
						? "¡Elige una pasiva de un rival!"
						: "¡Elige a un jugador objetivo!"}
				</div>
			)}

			{/* Mapeo circular de los oponentes */}
			{opponents.map((player: Opponent, index: number) => {
				const total = opponents.length;

				// === LÓGICA DE POSICIONAMIENTO RADIAL ===
				// El ángulo máximo de apertura (ej: de -70 grados a +70 grados)
				const maxAngle = 70;

				// Repartimos a los jugadores equitativamente en el arco
				const angleDeg =
					total === 1 ? 0 : -maxAngle + (index * (maxAngle * 2)) / (total - 1);
				const angleRad = angleDeg * (Math.PI / 180);

				// Radio (Distancia desde el Polycom hacia el borde)
				const radius = 380;

				// Calculamos las coordenadas X e Y
				const x = Math.sin(angleRad) * radius;
				const y = -Math.cos(angleRad) * radius;

				return (
					<div
						key={player.name}
						className="absolute top-[45%] left-1/2 pointer-events-auto"
						style={{
							// Movemos el componente a su posición circular
							transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(${angleDeg * 0.3}deg)`,
							// Nota: Le he puesto un rotate pequeño para que no queden 100% rectos, sino orientados levemente hacia el centro.
						}}
					>
						<OpponentCard
							player={player}
							isMyTurn={isMyTurn}
							selectedCardId={selectedCardId}
							selectedCardType={selectedCardType}
							onAction={handleAction}
							turnTimeLeft={turnTimeLeft}
							isTurnPaused={isTurnPaused}
						/>
					</div>
				);
			})}
		</div>
	);
}
