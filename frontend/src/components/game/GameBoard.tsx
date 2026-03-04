import { useParams } from "react-router-dom";
import { useLiveGame } from "../../hooks/game/useLiveGame.ts";
import { useState } from "react";
import type { CardInstance } from "../../types/types.ts";
import { PlayerHand } from "./PlayerHand.tsx";
import { OpponentsBoard } from "./OpponentsBoard.tsx";

export default function GameBoard() {
	const { id } = useParams();
	const { gameData, loading, myPlayerName, playTurn, endTurn, reactToAttack } =
		useLiveGame(id);
	const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

	if (loading) {
		return (
			<div className="flex flex-col items-center justify-center h-[70vh]">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
				<h2 className="text-xl text-gray-400 animate-pulse">
					Repartiendo cartas...
				</h2>
			</div>
		);
	}

	if (!gameData || !myPlayerName) return null;

	const { me, game } = gameData;
	const isMyTurn = game.current_turn === myPlayerName;
	const hasUsedAttackThisTurn = me.attack_used_this_turn;
	const selectedCardType =
		me.cards.find((c) => c.id === selectedCardId)?.type ?? null;

	const handleCardClick = (card: CardInstance) => {
		// Reacción: carta de esquive cuando tiene un ataque entrante
		if (me.incoming_attack && card.type === 3) {
			reactToAttack("dodge", card.id);
			return;
		}

		if (!isMyTurn) return;

		// Carta de curación
		if (card.type === 2) {
			// solo si tengo estrés > 0
			if (me.stress <= 0) return;
			playTurn(card.id, myPlayerName);
			return;
		}

		// Carta de ataque
		if (card.type === 1) {
			// bloquea segundo ataque
			if (hasUsedAttackThisTurn) return;
		}

		// Resto de cartas (ataque, etc.): flujo normal de selección
		setSelectedCardId((prev) => (prev === card.id ? null : card.id));
	};

	const handleOpponentClick = (targetName: string, isOnline: boolean) => {
		if (!isMyTurn || selectedCardId === null || !isOnline) return;

		const selectedCard = me.cards.find((c) => c.id === selectedCardId);
		// Intentar robar
		if (selectedCard?.type === 4) {
			const target = game.opponents.find((o) => o.name === targetName);
			if (!target || target.cards_count === 0) return;
		}

		playTurn(selectedCardId, targetName);
		setSelectedCardId(null);
	};

	const handleEndTurn = async () => {
		if (!isMyTurn || selectedCardId !== null) return;
		await endTurn();
	};

	return (
		<div className="max-w-6xl mx-auto mt-4 flex flex-col h-[85vh]">
			{/* CABECERA */}
			<div className="bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-700 mb-4 flex justify-between items-center shrink-0">
				<h1 className="text-xl font-bold text-white flex items-center gap-2">
					⚔️ Chaos Inc.
					<span className="text-xs bg-red-900/50 text-red-400 px-2 py-1 rounded border border-red-700 font-mono">
						SALA: {id}
					</span>
				</h1>
				<div className="text-right">
					<p className="text-gray-400 text-xs uppercase font-bold">
						Turno Actual
					</p>
					<p className="text-blue-400 font-bold">
						{game.current_turn === myPlayerName
							? "👉 TU TURNO"
							: `👤 ${game.current_turn}`}
					</p>
				</div>
			</div>

			{/* MESA CENTRAL (Rivales) */}
			<OpponentsBoard
				opponents={game.opponents}
				isMyTurn={isMyTurn}
				selectedCardId={selectedCardId}
				selectedCardType={selectedCardType}
				onOpponentClick={handleOpponentClick}
			/>

			{/* ZONA DEL JUGADOR (Tus cartas y tu info) */}
			<div className="mt-4 bg-gray-800 p-6 rounded-xl border border-gray-700 shrink-0 flex gap-6 items-end">
				{me.skip_next_turn && (
					<div className="absolute -top-4 left-4 bg-orange-600 text-white text-xs font-bold px-3 py-1 rounded shadow-lg border border-orange-400">
						⚠️ Penalización: Perderás tu próximo turno por inactividad.
					</div>
				)}
				{/* Tu Info */}
				<div className="bg-gray-900 p-4 rounded-lg border border-gray-700 min-w-50">
					<h3 className="text-blue-400 font-bold truncate mb-3">
						{me.name} (Tú)
					</h3>
					<div className="flex justify-between items-center mb-2">
						<span className="text-xs text-gray-500 uppercase">Tu Rol</span>
						<span
							className={`text-sm font-bold ${me.role === "boss" ? "text-yellow-400" : "text-green-400"}`}
						>
							{me.role === "boss" ? "👑 JEFE" : "💼 EMPLEADO"}
						</span>
					</div>
					<div className="flex justify-between items-center">
						<span className="text-xs text-gray-500 uppercase">Estrés</span>
						<span className="text-sm font-bold text-red-500">{me.stress}</span>
					</div>
				</div>

				{/* Tus Cartas */}
				<PlayerHand
					me={me}
					isMyTurn={isMyTurn}
					selectedCardId={selectedCardId}
					onCardClick={handleCardClick}
					incomingAttack={me.incoming_attack}
					opponents={game.opponents}
				/>

				<div className="ml-auto flex flex-col items-end gap-2">
					{me.incoming_attack ? (
						<button
							onClick={() => reactToAttack("accept")}
							className="px-4 py-2 rounded font-bold text-sm transition bg-red-600 hover:bg-red-500 text-white"
						>
							Asumir daño
						</button>
					) : (
						<button
							onClick={handleEndTurn}
							disabled={!isMyTurn || selectedCardId !== null}
							className={`
								px-4 py-2 rounded font-bold text-sm transition
								${
									isMyTurn && selectedCardId === null
										? "bg-purple-600 hover:bg-purple-500 text-white"
										: "bg-gray-700 text-gray-500 cursor-not-allowed"
								}
								`}
						>
							Terminar turno
						</button>
					)}
				</div>
			</div>
		</div>
	);
}
