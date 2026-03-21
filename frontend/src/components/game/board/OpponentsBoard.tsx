// src/components/game/board/OpponentsBoard.tsx

import { useGameStore } from "../../../store/useGameStore.ts";
import { usePlayerIdentity } from "../../../hooks/usePlayerIdentity.ts";
import type { Opponent } from "../../../types/live-game.ts";

interface OpponentsBoardProps {
	selectedCardId: string | null;
	selectedCardType: number | null;
	onCardPlayed: () => void;
}

export function OpponentsBoard({
	selectedCardId,
	selectedCardType,
	onCardPlayed,
}: OpponentsBoardProps) {
	const { myPlayerName } = usePlayerIdentity();

	// --- SUSCRIPCIÓN AL STORE ---
	const gameData = useGameStore((state) => state.gameData);
	const playTurn = useGameStore((state) => state.playTurn);

	if (!gameData || !myPlayerName) return null;

	const { opponents, current_turn } = gameData.game;
	const isMyTurn = current_turn === myPlayerName;

	// --- LÓGICA DE CLIC INTERNA ---
	const handleAction = async (targetName: string, isOnline: boolean) => {
		if (!isMyTurn || !selectedCardId || !isOnline) return;

		const success = await playTurn(selectedCardId, targetName);
		if (success) {
			onCardPlayed();
		}
	};

	return (
		<div className="flex-1 bg-gray-900/50 rounded-xl border border-gray-800 p-6 flex flex-wrap justify-center items-center gap-6 overflow-y-auto relative">
			<div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
				<span className="text-9xl">🃏</span>
			</div>

			{/* Banner de aviso */}
			{isMyTurn && selectedCardId !== null && (
				<div className="absolute top-4 left-1/2 -translate-x-1/2 bg-yellow-500/20 text-yellow-400 px-6 py-2 rounded-full border border-yellow-500 font-bold animate-bounce shadow-lg z-20">
					¡Elige a un jugador objetivo!
				</div>
			)}

			{opponents.map((player: Opponent) => {
				// --- REGLAS DE SELECCIÓN (Iguales, pero con datos del Store) ---
				const isCardActive = isMyTurn && selectedCardId !== null;
				const isTargetingCard = [1, 4, 6].includes(selectedCardType || 0);

				const isUnstealable =
					selectedCardType === 4 && player.cards_count === 0;
				const isAlreadyBlocked = selectedCardType === 6 && player.is_blocked;

				let tooltipMessage = "";
				let isUnclickable = false;

				if (player.is_dead) {
					tooltipMessage = "Este jugador ha sido despedido (Muerto).";
					isUnclickable = true;
				} else if (!player.is_online) {
					tooltipMessage = "Este jugador está en pausa (Offline).";
					isUnclickable = true;
				} else if (isCardActive && isTargetingCard) {
					if (isUnstealable) {
						tooltipMessage = "La mesa de este jugador está vacía (0 cartas).";
						isUnclickable = true;
					} else if (isAlreadyBlocked) {
						tooltipMessage = "Este jugador ya está sufriendo una auditoría.";
						isUnclickable = true;
					}
				}

				const canBeTargeted = isCardActive && isTargetingCard && !isUnclickable;

				return (
					<div
						key={player.name}
						onClick={() => handleAction(player.name, player.is_online)}
						className={`relative bg-gray-800 p-4 rounded-lg border-2 w-48 text-center shadow-xl z-10 transition-all
                            ${player.role === "boss" ? "border-yellow-600" : "border-gray-700"}
                            ${!player.is_online ? "opacity-40 grayscale scale-95" : ""}
                            ${player.is_dead ? "opacity-50 grayscale scale-95 border-red-900" : ""}
                            ${isUnclickable && !player.is_dead && player.is_online ? "opacity-30 grayscale scale-95" : ""}
                            ${canBeTargeted ? "cursor-crosshair hover:scale-105 hover:border-blue-400 hover:shadow-blue-500/50" : isUnclickable ? "cursor-not-allowed" : "cursor-default"}
                        `}
						title={tooltipMessage || undefined}
					>
						{/* Indicadores visuales */}
						{!player.is_online && (
							<div className="absolute -top-3 -right-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded shadow-lg animate-pulse z-50">
								🔌 OFFLINE
							</div>
						)}

						{player.role === "boss" && (
							<div className="absolute -top-6 left-1/2 -translate-x-1/2 text-3xl drop-shadow-lg z-40">
								👑
							</div>
						)}

						{player.has_shield && (
							<div className="absolute -top-3 -left-3 bg-cyan-700 text-white text-xs font-bold px-2 py-1 rounded shadow-lg z-50">
								🛡️
							</div>
						)}

						{player.is_dead && (
							<div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gray-900 text-red-500 text-xs font-bold px-2 py-1 rounded shadow-lg z-50 border border-red-800">
								💀
							</div>
						)}

						{player.is_blocked && (
							<div className="absolute -top-3 right-6 bg-purple-700 text-white text-xs font-bold px-2 py-1 rounded shadow-lg z-50">
								🔒
							</div>
						)}

						<h3
							className={`font-bold truncate ${!player.is_online ? "text-gray-500" : "text-white"}`}
						>
							{player.name}
						</h3>

						<div className="mt-3 bg-gray-900 rounded p-2 border border-gray-700">
							<p className="text-xs text-gray-500 uppercase">Estrés</p>
							<p
								className={`text-lg font-black ${!player.is_online ? "text-gray-600" : "text-red-500"}`}
							>
								{player.stress}
							</p>
						</div>

						<div className="mt-2 text-xs text-blue-300">
							Cartas:{" "}
							<span className="font-mono text-blue-200">
								{player.cards_count}
							</span>
						</div>
					</div>
				);
			})}
		</div>
	);
}
