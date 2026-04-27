// src/pages/GameBoardPage.tsx

import { useParams } from "react-router-dom";
import { useLiveGame } from "../hooks/game/useLiveGame.ts";
import { useGameBoard } from "../hooks/game/useGameBoard.ts";
import { useGameTimers } from "../hooks/game/useGameTimers.ts";
import { useGameUIStore } from "../store/useGameUIStore.ts";

import { TARGET_CARDS } from "../hooks/game/usePlayerActions.ts";
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
	const isTargetingMode = selectedCard
		? TARGET_CARDS.includes(selectedCard.type)
		: false;

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

			{/* ── 2. MARCADOR Y MAZO ── */}
			{/* VERSIÓN MÓVIL: Pestaña pequeña arriba a la derecha */}
			<div className="absolute top-0 right-4 z-40 lg:hidden flex gap-2">
				{/* Mazo (Móvil) */}
				<div className="bg-[#e5e7eb] border-x-2 border-b-2 border-[#9ca3af] px-3 py-1 pb-2 rounded-b-md shadow-md flex flex-col items-center justify-center transform origin-top hover:translate-y-1 transition-transform">
					<span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">
						Mazo
					</span>
					<span className="text-sm font-black text-[#393e42] leading-none">
						{board.game.deck_count}
					</span>
				</div>

				{/* Sala y Ronda (Móvil) */}
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

			{/* VERSIÓN ESCRITORIO (PC): El Teléfono Polycom Central */}
			<div className="hidden lg:block absolute left-1/2 top-[45%] transform -translate-x-1/2 -translate-y-1/2 z-10">
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

			{/* ── 3. REGISTRO LOG ── */}
			<GameLog />

			{/* BOTÓN CANCELAR APUNTADO FLOTANTE (Solo sale si esTargetingMode es true) */}
			<div
				className={`fixed top-1/2 right-0 -translate-y-1/2 z-100 transition-transform duration-500 ease-in-out ${
					isTargetingMode ? "translate-x-0" : "translate-x-full"
				}`}
			>
				<button
					onClick={() => setSelectedCardId(null)}
					className="bg-red-600 hover:bg-red-500 text-white font-black px-3 py-6 lg:px-4 lg:py-8 rounded-l-xl border-y-4 border-l-4 border-red-800 flex items-center justify-center group"
					style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
					title="Cancelar carta seleccionada"
				>
					<span className="transform rotate-180 tracking-widest text-base lg:text-lg group-hover:scale-110 transition-transform">
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
