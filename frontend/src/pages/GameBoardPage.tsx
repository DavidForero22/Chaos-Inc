// src/pages/GameBoardPage.tsx

import { useParams } from "react-router-dom";
import { useLiveGame } from "../hooks/game/useLiveGame.ts";
import { useGameBoard } from "../hooks/game/useGameBoard.ts";
import { useGameTimers } from "../hooks/game/useGameTimers.ts";

import { OpponentsBoard } from "../components/game/board/OpponentsBoard.tsx";
import { PlayerArea } from "../components/game/player/PlayerArea.tsx";
import { GameLog } from "../components/game/board/GameLog.tsx";
import { GameBanners } from "../components/game/ui/GameBanners.tsx";
import { GameOverlayManager } from "../components/game/overlays/GameOverlayManager.tsx";
import { OrientationWarning } from "../components/game/ui/OrientationWarning.tsx";

export default function GameBoardPage() {
	const { id } = useParams();
	const roomId = id!;

	const { isConnecting } = useLiveGame(roomId);
	const timers = useGameTimers();
	const board = useGameBoard();

	if (isConnecting || !board.gameData || !board.me || !board.game) {
		return (
			<div className="flex flex-col items-center justify-center h-screen bg-[#393e42] text-white">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#cbbe34] mb-4"></div>
				<h2 className="text-xl font-mono animate-pulse">
					Conectando a la mesa...
				</h2>
			</div>
		);
	}

	return (
		<div
			className="relative w-full h-screen overflow-hidden font-mono bg-black"
			style={{
				backgroundImage: "url('/background_1.jpg')",
				backgroundSize: "cover",
				backgroundPosition: "center",
			}}
		>
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

			{/* ── 1. OPONENTES ── */}
			<OpponentsBoard
				turnTimeLeft={timers.turnTimeLeft}
				isTurnPaused={timers.isTurnPaused}
			/>

			{/* ── 2. OBJETO CENTRAL (Teléfono Polycom) ── */}
			<div className="absolute top-[45%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
				<div className="w-56 h-48 bg-[#2a2a2a] rounded-[40px] border-4 border-[#1a1a1a] shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex flex-col items-center justify-center relative">
					<div className="bg-[#4a8fcf] w-3/4 h-20 border-[3px] border-[#111] shadow-inner flex flex-col items-center justify-center text-black">
						<span className="text-sm font-bold opacity-80">SALA {roomId}</span>
						<span className="text-2xl font-black">
							RONDA {board.game.round_number}
						</span>
					</div>
					<div className="mt-4 flex gap-2">
						<div className="w-3 h-3 bg-gray-600 rounded-full"></div>
						<div className="w-3 h-3 bg-gray-600 rounded-full"></div>
						<div className="w-3 h-3 bg-gray-600 rounded-full"></div>
					</div>
					<div className="absolute -left-20 top-1/2 transform -translate-y-1/2 bg-gray-300 w-16 h-20 border border-gray-400 shadow-lg flex items-center justify-center rotate-[-10deg]">
						<span className="text-xs font-bold text-gray-700 text-center leading-tight">
							MAZO
							<br />
							{board.game.deck_count}
						</span>
					</div>
				</div>
			</div>

			{/* ── 3. REGISTRO LOG (Componente autogestionado) ── */}
			<GameLog />

			{/* ── 4. ÁREA DEL JUGADOR ── */}
			<PlayerArea
				turnTimeLeft={timers.turnTimeLeft}
				isTurnPaused={timers.isTurnPaused}
			/>

			<OrientationWarning />
		</div>
	);
}
