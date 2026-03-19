import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";

// --- HOOKS ---
import { useLiveGame } from "../hooks/game/useLiveGame.ts";
import { useReconnectionTimers } from "../hooks/game/useReconnectionTimers.ts";

// --- TIPOS ---
import type { CardInstance, Opponent } from "../types/live-game.ts";

// --- COMPONENTES ---
import { OpponentsBoard } from "../components/game/OpponentsBoard.tsx";
import { RoleRevealModal } from "../components/game/RoleRevealModal.tsx";
import { GameOverModal } from "../components/game/GameOverModal.tsx";
import { PlayerArea } from "../components/game/PlayerArea.tsx";

export default function GameBoardPage() {
	const { id } = useParams();
	const navigate = useNavigate();

	const {
		gameData,
		loading,
		myPlayerName,
		playTurn,
		endTurn,
		reactToAttack,
		isFirstLoad,
		setIsFirstLoad,
		gameOver,
		showActingBossModal, 
        setShowActingBossModal
	} = useLiveGame(id);

	const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

	// --- Lógica de Timers (Extraída) ---
	const {
		showBossWaiting,
		showActingBossWaiting,
		showEndingWaiting,
		showInheritanceBanner,
	} = useReconnectionTimers(
		gameData?.game.boss_disconnected,
		gameData?.game.acting_boss_disconnected,
		gameData?.game.ending_soon,
	);

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
	const hasPendingAttack = me.has_pending_attack;
	const selectedCardType =
		me.cards.find((c: CardInstance) => c.id === selectedCardId)?.type ?? null;

	// --- LÓGICA DE JUGABILIDAD ---
	const handleCardClick = (card: CardInstance) => {
		if (me.incoming_attack && card.type === 3) {
			reactToAttack("dodge", card.id);
			return;
		}

		if (!isMyTurn) return;

		if (card.type === 2 && me.stress > 0)
			return playTurn(card.id, myPlayerName);
		if (card.type === 1 && me.attack_used_this_turn) return;
		if (card.type === 5 && !me.has_shield)
			return playTurn(card.id, myPlayerName);

		setSelectedCardId((prev) => (prev === card.id ? null : card.id));
	};

	const handleOpponentClick = (targetName: string, isOnline: boolean) => {
		if (!isMyTurn || selectedCardId === null || !isOnline) return;

		const selectedCard = me.cards.find(
			(c: CardInstance) => c.id === selectedCardId,
		);
		if (selectedCard?.type === 4) {
			const target = game.opponents.find(
				(o: Opponent) => o.name === targetName,
			);
			if (!target || target.cards_count === 0) return;
		}

		playTurn(selectedCardId, targetName);
		setSelectedCardId(null);
	};

	const handleEndTurn = async () => {
		if (!isMyTurn || selectedCardId !== null || hasPendingAttack) return;
		await endTurn();
	};

	// --- RENDER ---
	return (
		<div className="max-w-6xl mx-auto mt-4 flex flex-col h-[85vh]">
			{/* --- MODALES --- */}
			{isFirstLoad && (
				<RoleRevealModal role={me.role} onClose={() => setIsFirstLoad(false)} />
			)}

			{showActingBossModal && (
				<RoleRevealModal
					role={gameData?.me?.role}
					isActingBoss={true}
					onClose={() => setShowActingBossModal(false)}
				/>
			)}

			{gameOver && (
				<GameOverModal
					winnerRole={game.winner_role}
					myRole={me.role}
					onClose={() => navigate("/")}
				/>
			)}

			{/* --- ALERTAS DE RECONEXIÓN --- */}
			{showActingBossWaiting && (
				<div className="bg-orange-900/40 border border-orange-700 text-orange-300 text-sm font-semibold px-4 py-2 rounded-lg mb-3 text-center">
					⏳ El jefe heredado se ha desconectado. Esperando 10s para
					reconexión...
				</div>
			)}
			{showBossWaiting && (
				<div className="bg-blue-900/40 border border-blue-700 text-blue-300 text-sm font-semibold px-4 py-2 rounded-lg mb-3 text-center">
					⏳ El jefe se ha desconectado. Esperando 10s para reconexión o
					sucesión...
				</div>
			)}
			{showInheritanceBanner && (
				<div className="bg-yellow-900/40 border border-yellow-700 text-yellow-300 text-sm font-semibold px-4 py-2 rounded-lg mb-3 text-center">
					⚠️ El tiempo expiró. Alguien ha heredado el cargo en secreto.
				</div>
			)}

			{showEndingWaiting && (
				<div className="bg-red-900/40 border border-red-700 text-red-300 text-sm font-semibold px-4 py-2 rounded-lg mb-3 text-center">
					⚠️ La partida podría terminar por abandono. Dando 10s de cortesía...
				</div>
			)}

			{/* --- CABECERA --- */}
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
						{isMyTurn ? "👉 TU TURNO" : `👤 ${game.current_turn}`}
					</p>
					<p className="text-gray-500 text-xs mt-1">
						Ronda {game.round_number} · 🃏 {game.deck_count} cartas
					</p>
				</div>
			</div>

			{/* --- TABLERO --- */}
			<OpponentsBoard
				opponents={game.opponents}
				isMyTurn={isMyTurn}
				selectedCardId={selectedCardId}
				selectedCardType={selectedCardType}
				onOpponentClick={handleOpponentClick}
			/>

			{/* --- ZONA DEL JUGADOR--- */}
			<PlayerArea
				me={me}
				isMyTurn={isMyTurn}
				selectedCardId={selectedCardId}
				hasPendingAttack={hasPendingAttack}
				opponents={game.opponents}
				onCardClick={handleCardClick}
				onEndTurn={handleEndTurn}
				onReactToAttack={reactToAttack}
			/>
		</div>
	);
}
