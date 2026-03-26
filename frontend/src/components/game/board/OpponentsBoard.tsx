// frontend/src/components/game/board/OpponentsBoard.tsx

import { useMemo } from "react";
import { useGameStore } from "../../../store/useGameStore.ts";
import { useGameUIStore } from "../../../store/useGameUIStore.ts";
import { usePlayerIdentity } from "../../../hooks/usePlayerIdentity.ts";
import { OpponentCard } from "./OpponentCard.tsx"; // <-- Importamos el nuevo componente
import type { Opponent, CardInstance } from "../../../types/live-game.ts";

export function OpponentsBoard() {
	const { myPlayerName } = usePlayerIdentity();

	const gameData = useGameStore((state) => state.gameData);
	const playTurn = useGameStore((state) => state.playTurn);
	const { selectedCardId, setSelectedCardId } = useGameUIStore();

	if (!gameData || !myPlayerName) return null;

	const { me, game } = gameData;
	const { opponents, current_turn } = game;
	const isMyTurn = current_turn === myPlayerName;

	const selectedCardType =
		me.cards.find((c: CardInstance) => c.id === selectedCardId)?.type ?? null;

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

	const symmetricallyOrderedOpponents = useMemo(() => {
		const sorted = [...opponents].sort((a, b) => b.distance - a.distance);
		const ordered: Opponent[] = [];

		sorted.forEach((opponent, index) => {
			if (index % 2 === 0) {
				ordered.unshift(opponent);
			} else {
				ordered.push(opponent);
			}
		});

		return ordered;
	}, [opponents]);

	return (
		<div className="flex-1 bg-gray-900/50 rounded-xl border border-gray-800 p-6 flex flex-wrap justify-center items-center gap-6 overflow-y-auto relative">
			<div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
				<span className="text-9xl">🃏</span>
			</div>

			{/* Banner de aviso */}
			{isMyTurn && selectedCardId !== null && (
				<div className="absolute top-4 left-1/2 -translate-x-1/2 bg-yellow-500/20 text-yellow-400 px-6 py-2 rounded-full border border-yellow-500 font-bold animate-bounce shadow-lg z-20">
					{selectedCardType === 12
						? "¡Elige una pasiva de un rival!"
						: "¡Elige a un jugador objetivo!"}
				</div>
			)}

			{/* Mapeo de componentes */}
			{symmetricallyOrderedOpponents.map((player: Opponent) => (
				<OpponentCard
					key={player.name}
					player={player}
					isMyTurn={isMyTurn}
					selectedCardId={selectedCardId}
					selectedCardType={selectedCardType}
					onAction={handleAction}
				/>
			))}
		</div>
	);
}
