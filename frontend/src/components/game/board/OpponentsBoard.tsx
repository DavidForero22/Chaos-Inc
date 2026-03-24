// frontend/src/components/game/board/OpponentsBoard.tsx

import { useMemo } from "react";

import { useGameStore } from "../../../store/useGameStore.ts";
import { useGameUIStore } from "../../../store/useGameUIStore.ts";
import { usePlayerIdentity } from "../../../hooks/usePlayerIdentity.ts";
import type { Opponent, CardInstance } from "../../../types/live-game.ts";

export function OpponentsBoard() {
	const { myPlayerName } = usePlayerIdentity();

	// --- ESTADO GLOBAL (Servidor) ---
	const gameData = useGameStore((state) => state.gameData);
	const playTurn = useGameStore((state) => state.playTurn);

	// --- ESTADO LOCAL (UI) ---
	const { selectedCardId, setSelectedCardId } = useGameUIStore();

	if (!gameData || !myPlayerName) return null;

	const { me, game } = gameData;
	const { opponents, current_turn } = game;
	const isMyTurn = current_turn === myPlayerName;

	// Calcular dinámicamente el tipo de la carta seleccionada
	const selectedCardType =
		me.cards.find((c: CardInstance) => c.id === selectedCardId)?.type ?? null;

	// --- LÓGICA DE CLIC INTERNA ---
	const handleAction = async (targetName: string, isOnline: boolean) => {
		if (!isMyTurn || !selectedCardId || !isOnline) return;

		const success = await playTurn(selectedCardId, targetName);
		if (success) {
			setSelectedCardId(null); // Limpiar la selección si el ataque tuvo éxito
		}
	};

	// --- ALGORITMO DE ORDENACIÓN SIMÉTRICA --
    const symmetricallyOrderedOpponents = useMemo(() => {
        // Ordenar todos los oponentes de mayor a menor distancia
        const sorted = [...opponents].sort((a, b) => b.distance - a.distance);
        const ordered: Opponent[] = [];

        // Repartir desde el centro hacia los extremos
        sorted.forEach((opponent, index) => {
            if (index % 2 === 0) {
                ordered.unshift(opponent); // Pares a la izquierda
            } else {
                ordered.push(opponent);    // Impares a la derecha
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
					¡Elige a un jugador objetivo!
				</div>
			)}

			{/* AHORA ITERAMOS SOBRE EL ARRAY REORDENADO SIMÉTRICAMENTE */}
			{symmetricallyOrderedOpponents.map((player: Opponent) => {
				// --- REGLAS DE SELECCIÓN ---
				const isCardActive = isMyTurn && selectedCardId !== null;
				const isTargetingCard = [1, 4, 6, 9].includes(selectedCardType || 0);
				const isOutOfRange = selectedCardType === 1 && !player.is_in_range;

				const isUnstealable =
					selectedCardType === 4 && player.cards_count === 0;

				const isPlayerBlocked =
					player.conditions?.is_blocked ?? (player as any).is_blocked;
				const isAlreadyBlocked = selectedCardType === 6 && isPlayerBlocked;

				const isSabotageUntargetable =
					selectedCardType === 9 && player.cards_count === 0;

				let tooltipMessage = "";
				let isUnclickable = false;

				if (player.is_dead) {
					tooltipMessage = "Este jugador está muerto.";
					isUnclickable = true;
				} else if (!player.is_online) {
					tooltipMessage = "Este jugador está desconectado.";
					isUnclickable = true;
				} else if (isCardActive && isTargetingCard) {
					if (isOutOfRange) {
						tooltipMessage = "Este jugador está fuera de tu alcance visual.";
						isUnclickable = true;
					} else if (isUnstealable) {
						tooltipMessage = "Este jugador no tiene cartas.";
						isUnclickable = true;
					} else if (isAlreadyBlocked) {
						tooltipMessage = "Este jugador ya está bloqueado.";
						isUnclickable = true;
					} else if (isSabotageUntargetable) {
						tooltipMessage = "Este jugador no tiene cartas que descartar.";
						isUnclickable = true;
					}
				}

				const canBeTargeted = isCardActive && isTargetingCard && !isUnclickable;

				const hasShield =
					player.conditions?.has_shield ?? (player as any).has_shield;
				const isActingBoss =
					player.conditions?.acting_boss ?? (player as any).acting_boss;

				return (
					<div
						key={player.name}
						onClick={() => {
							if (isUnclickable) return;
							handleAction(player.name, player.is_online);
						}}
						className={`relative bg-gray-800 p-4 rounded-lg border-2 w-48 text-center shadow-xl z-10 transition-all
                            ${player.role === "boss" ? "border-yellow-600" : "border-gray-700"}
                            ${!player.is_online ? "opacity-40 grayscale scale-95" : ""}
                            ${player.is_dead ? "opacity-50 grayscale scale-95 border-red-900" : ""}
                            ${isUnclickable && !player.is_dead && player.is_online ? "opacity-30 grayscale scale-95" : ""}
                            ${canBeTargeted ? "cursor-crosshair hover:scale-105 hover:border-blue-400 hover:shadow-blue-500/50" : isUnclickable ? "cursor-not-allowed" : "cursor-default"}
                        `}
						title={tooltipMessage || undefined}
					>
						{/* --- Indicador de Distancia --- */}
						{!player.is_dead && player.is_online && (
							<div
								className="absolute top-1 left-2 text-[10px] text-gray-500 font-mono"
								title={`Distancia: ${player.distance}`}
							>
								📍 {player.distance}
							</div>
						)}
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

						{isActingBoss && player.role !== "boss" && (
							<div className="absolute -top-6 left-1/2 -translate-x-1/2 text-3xl drop-shadow-lg z-40">
								👑
							</div>
						)}

						{hasShield && (
							<div className="absolute -top-3 -left-3 bg-cyan-700 text-white text-xs font-bold px-2 py-1 rounded shadow-lg z-50">
								🛡️
							</div>
						)}

						{player.is_dead && (
							<div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gray-900 text-red-500 text-xs font-bold px-2 py-1 rounded shadow-lg z-50 border border-red-800">
								💀
							</div>
						)}

						{isPlayerBlocked && (
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
