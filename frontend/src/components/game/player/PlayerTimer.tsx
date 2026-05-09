// src/components/game/player/PlayerTimer.tsx

import { useGameStore } from "../../../store/useGameStore.ts";

interface PlayerTimerProps {
	turnTimeLeft?: number | null;
	isTurnPaused?: boolean;
	className?: string;
}

export function PlayerTimer({
	turnTimeLeft,
	isTurnPaused = false,
	className = "",
}: PlayerTimerProps) {
	const gameData = useGameStore((state) => state.gameData);

	if (!gameData || !gameData.me || !gameData.game) return null;

	const { me, game } = gameData;
	const isMyTurn = String(game.current_turn) === String(me.id);

	// Lógica para saber si el jugador está ocupado reaccionando a algo
	const hasActiveReaction =
		game.pending_single_attack_target === me.name ||
		game.pending_multi_attack_targets.includes(me.name) ||
		game.player_pending_sabotage === me.name ||
		game.player_in_luck_challenge === me.name;

	const shouldShowTimer =
		isMyTurn &&
		!hasActiveReaction &&
		turnTimeLeft !== undefined &&
		turnTimeLeft !== null;

	const isLowTime =
		turnTimeLeft !== undefined && turnTimeLeft !== null && turnTimeLeft <= 10;

	if (!shouldShowTimer) return null;

	return (
		<div
			className={`px-3 py-1 font-bold text-sm shadow-md transform transition-colors border ${
				isTurnPaused
					? "bg-gray-300 border-gray-400 text-gray-700"
					: isLowTime
						? "bg-red-200 border-red-400 text-red-800 animate-pulse"
						: "bg-[#cbbe34] border-[#a89d2b] text-black"
			} ${className}`}
		>
			{isTurnPaused ? "PAUSA" : `⏳ ${turnTimeLeft}s`}
		</div>
	);
}
