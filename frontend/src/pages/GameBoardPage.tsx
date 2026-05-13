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
import { NotificationStack } from "../components/game/ui/NotificationStack.tsx";
import { DebugTools } from "../components/game/overlays/debug/DebugTools.tsx";
import { useInfoModeGuard } from "../hooks/game/useInfoModeGuard.ts";

export default function GameBoardPage() {
	const { id } = useParams();
	const roomId = id!;

	const { isConnecting } = useLiveGame(roomId);
	const timers = useGameTimers();
	const board = useGameBoard();

	const selectedCardId = useGameUIStore((state) => state.selectedCardId);
	const setSelectedCardId = useGameUIStore((state) => state.setSelectedCardId);

	useInfoModeGuard();

	if (isConnecting || !board.gameData || !board.me || !board.game) {
		return (
			<div
				className="flex flex-col items-center justify-center h-screen bg-[#393e42] text-white"
				// --- ACCESIBILIDAD: Anunciar estado de carga ---
				role="status"
				aria-live="polite"
			>
				<div
					className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#cbbe34] mb-4"
					aria-hidden="true"
				></div>
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
		<main
			className="relative w-full h-screen overflow-hidden font-mono bg-black"
			style={{
				backgroundImage: "url('/background_1.jpg')",
				backgroundSize: "cover",
				backgroundPosition: "center",
			}}
			aria-label="Tablero de juego"
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

			<NotificationStack />

			{/* ── 1. OPONENTES ── */}
			<OpponentsBoard
				turnTimeLeft={timers.turnTimeLeft}
				isTurnPaused={timers.isTurnPaused}
			/>

			{/* ── 2. MARCADOR Y MAZO (Global para todos los dispositivos) ── */}
			<section
				className="absolute top-0 right-4 z-40 flex gap-2"
				aria-label="Información general de la partida"
			>
				{/* Mazo */}
				<div
					className="bg-[#e5e7eb] border-x-2 border-b-2 border-[#9ca3af] px-3 py-1 pb-2 rounded-b-md shadow-md flex flex-col items-center justify-center transform origin-top hover:translate-y-1 transition-transform"
					title={`Mazo: ${board.game.deck_count} cartas restantes`}
				>
					<span
						className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-0.5"
						aria-hidden="true"
					>
						Mazo
					</span>
					<span
						className="text-sm font-black text-[#393e42] leading-none"
						aria-hidden="true"
					>
						{board.game.deck_count}
					</span>
					<span className="sr-only">
						Mazo: {board.game.deck_count} cartas restantes
					</span>
				</div>

				{/* Sala y Ronda */}
				<div
					className="bg-[#c19a6b] border-x-2 border-b-2 border-[#a68256] px-4 py-1 pb-2 rounded-b-md shadow-md flex flex-col items-center justify-center relative"
					title={`Sala ${roomId}, Ronda ${board.game.round_number}`}
				>
					{/* Textura de cartón para la pestaña */}
					<div
						className="absolute inset-0 opacity-20 pointer-events-none rounded-b-md"
						aria-hidden="true"
						style={{
							backgroundImage:
								"url('https://www.transparenttextures.com/patterns/cardboard.png')",
						}}
					></div>
					<span
						className="text-[9px] font-bold text-[#5c4a3d] uppercase tracking-wider mb-0.5 relative z-10"
						aria-hidden="true"
					>
						Sala {roomId}
					</span>
					<span
						className="text-sm font-black text-[#2c1a12] leading-none relative z-10"
						aria-hidden="true"
					>
						Ronda {board.game.round_number}
					</span>
					<span className="sr-only">
						Sala {roomId}, Ronda {board.game.round_number}
					</span>
				</div>
			</section>

			{/* ── 3. MENÚ SUPERIOR IZQUIERDO (HUD Pegados) ── */}
			<nav
				className="absolute -top-1 left-10 z-48 flex gap-3 items-start"
				aria-label="Herramientas de partida"
			>
				<LeaveMatch />
				<GameLog />
				<IconGuide />
				<DebugTools roomId={id || ""} />
			</nav>

			{/* BOTÓN CANCELAR APUNTADO FLOTANTE (Solo en Móvil) */}
			{isTargetingMode && (
				<div className="fixed top-1/2 right-0 -translate-y-1/2 z-100 lg:hidden animate-in slide-in-from-right-8 duration-300">
					<button
						onClick={() => setSelectedCardId(null)}
						className="bg-red-600 hover:bg-red-500 text-white font-black px-3 py-6 rounded-l-xl border-y-4 border-l-4 border-red-800 flex items-center justify-center group shadow-[-4px_0_15px_rgba(0,0,0,0.5)] focus:outline-none focus:ring-4 focus:ring-red-400"
						style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
						title="Cancelar carta seleccionada"
						aria-label="Cancelar selección de carta"
					>
						<span
							className="transform rotate-180 tracking-widest text-base group-hover:scale-110 transition-transform"
							aria-hidden="true"
						>
							CANCELAR
						</span>
					</button>
				</div>
			)}

			<PlayerArea
				turnTimeLeft={timers.turnTimeLeft}
				isTurnPaused={timers.isTurnPaused}
			/>
			<OrientationWarning />
		</main>
	);
}
