import { useParams } from "react-router-dom";
import { useLiveGame } from "../hooks/game/useLiveGame.ts";
import { useGameBoard } from "../hooks/game/useGameBoard.ts";
import { useGameTimers } from "../hooks/game/useGameTimers.ts";

import { OpponentsBoard } from "../components/game/board/OpponentsBoard.tsx";
import { PlayerArea } from "../components/game/player/PlayerArea.tsx";
import { GameLog } from "../components/game/board/GameLog.tsx";
import { GameBanners } from "../components/game/ui/GameBanners.tsx";
import { GameOverlayManager } from "../components/game/overlays/GameOverlayManager.tsx";

export default function GameBoardPage() {
	const { id } = useParams();
	const roomId = id!;

	// Iniciar el controlador de WebSockets
	const { isConnecting } = useLiveGame(roomId);

	// Banners y Temporizadores
	const timers = useGameTimers();

	// El cerebro de la partida
	const board = useGameBoard();

	// --- PANTALLA DE CARGA INICIAL ---
	if (isConnecting || !board.gameData || !board.me || !board.game) {
		return (
			<div className="flex flex-col items-center justify-center h-[70vh]">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
				<h2 className="text-xl text-gray-400 animate-pulse">
					Conectando con la partida...
				</h2>
			</div>
		);
	}

	// --- RENDER DEL TABLERO ---
	return (
		<div className="max-w-6xl mx-auto mt-4 flex flex-col h-[85vh]">
			<GameOverlayManager
				roomId={roomId}
				me={board.me}
				game={board.game}
				isMyTurn={board.isMyTurn}
			/>

			<GameBanners
				playerPendingSabotage={board.game.player_pending_sabotage}
				{...timers}
			/>

			{/* --- CABECERA --- */}
			<div className="bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-700 mb-4 flex justify-between items-center shrink-0">
				<h1 className="text-xl font-bold text-white flex items-center gap-2">
					⚔️ Chaos Inc.
					<span className="text-xs bg-red-900/50 text-red-400 px-2 py-1 rounded border border-red-700 font-mono">
						SALA: {roomId}
					</span>
				</h1>
				<div className="text-right">
					<p className="text-gray-400 text-xs uppercase font-bold">
						Turno Actual
					</p>
					<p className="text-blue-400 font-bold">
						{board.isMyTurn ? "👉 TU TURNO" : `👤 ${board.game.current_turn}`}
					</p>
					<p className="text-gray-500 text-xs mt-1">
						Ronda {board.game.round_number} · 🃏 {board.game.deck_count} cartas
					</p>
				</div>
			</div>

			{/* --- TABLERO SUPERIOR (Oponentes) --- */}
			<OpponentsBoard
			/>

			{/* --- ZONA INFERIOR (Tú) --- */}
			<PlayerArea />

			<GameLog />
		</div>
	);
}
