// src/pages/GameBoardPage.tsx

import { useParams } from "react-router-dom";
import { useLiveGame } from "../hooks/game/useLiveGame.ts";
import { useGameBoard } from "../hooks/game/useGameBoard.ts";
import { useGameTimers } from "../hooks/game/useGameTimers.ts";
import { useGameUIStore } from "../store/useGameUIStore.ts";

import { OpponentsBoard } from "../components/game/board/OpponentsBoard.tsx";
import { PlayerArea } from "../components/game/player/PlayerArea.tsx";
import { GameLog } from "../components/game/board/GameLog.tsx";
import { GameBanners } from "../components/game/ui/GameBanners.tsx";
import { GameOverlayManager } from "../components/game/overlays/GameOverlayManager.tsx";
import { OrientationWarning } from "../components/game/ui/OrientationWarning.tsx";
import { IconGuide } from "../components/game/board/IconGuide.tsx";
import { LeaveMatch } from "../components/game/board/LeaveMatch.tsx";

export default function GameBoardPage() {
	const { id } = useParams();
	const roomId = id!;

	const { isConnecting } = useLiveGame(roomId);
	const timers = useGameTimers();
	const board = useGameBoard();

	const selectedCardId = useGameUIStore((state) => state.selectedCardId);
	const setSelectedCardId = useGameUIStore((state) => state.setSelectedCardId);

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

	// LÓGICA INTELIGENTE: ¿Es una carta de apuntar?
	const selectedCard = board.me.cards.find((c) => c.id === selectedCardId);
	const isTargetingMode = selectedCard?.target === "opponent";

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

			{/* ── 2. MARCADOR Y MAZO (Global para todos los dispositivos) ── */}
			<div className="absolute top-0 right-4 z-40 flex gap-2">
				{/* Mazo */}
				<div className="bg-[#e5e7eb] border-x-2 border-b-2 border-[#9ca3af] px-3 py-1 pb-2 rounded-b-md shadow-md flex flex-col items-center justify-center transform origin-top hover:translate-y-1 transition-transform">
					<span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">
						Mazo
					</span>
					<span className="text-sm font-black text-[#393e42] leading-none">
						{board.game.deck_count}
					</span>
				</div>

				{/* Sala y Ronda */}
				<div className="bg-[#c19a6b] border-x-2 border-b-2 border-[#a68256] px-4 py-1 pb-2 rounded-b-md shadow-md flex flex-col items-center justify-center relative">
					{/* Textura de cartón para la pestaña */}
					<div
						className="absolute inset-0 opacity-20 pointer-events-none rounded-b-md"
						style={{
							backgroundImage:
								"url('https://www.transparenttextures.com/patterns/cardboard.png')",
						}}
					></div>
					<span className="text-[9px] font-bold text-[#5c4a3d] uppercase tracking-wider mb-0.5 relative z-10">
						Sala {roomId}
					</span>
					<span className="text-sm font-black text-[#2c1a12] leading-none relative z-10">
						Ronda {board.game.round_number}
					</span>
				</div>
			</div>

			{/* ── 3. MENÚ SUPERIOR IZQUIERDO (HUD Pegados) ── */}
			<div className="absolute -top-1 left-10 z-48 flex gap-3 items-start">
				<LeaveMatch />
				<GameLog />
				<IconGuide />
			</div>

			{/* BOTÓN CANCELAR APUNTADO FLOTANTE (Solo en Móvil) */}
			<div
				className={`fixed top-1/2 right-0 -translate-y-1/2 z-100 transition-transform duration-500 ease-in-out lg:hidden ${
					isTargetingMode ? "translate-x-0" : "translate-x-full"
				}`}
			>
				<button
					onClick={() => setSelectedCardId(null)}
					className="bg-red-600 hover:bg-red-500 text-white font-black px-3 py-6 rounded-l-xl border-y-4 border-l-4 border-red-800 flex items-center justify-center group shadow-[-4px_0_15px_rgba(0,0,0,0.5)]"
					style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
					title="Cancelar carta seleccionada"
				>
					<span className="transform rotate-180 tracking-widest text-base group-hover:scale-110 transition-transform">
						CANCELAR
					</span>
				</button>
			</div>

			<PlayerArea
				turnTimeLeft={timers.turnTimeLeft}
				isTurnPaused={timers.isTurnPaused}
			/>
			<OrientationWarning />
		</div>
	);
}
