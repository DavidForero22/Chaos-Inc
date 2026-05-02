import { useNavigate } from "react-router-dom";
import { useGameStore } from "../../../store/useGameStore.ts";
import { RoleRevealModal } from "./RoleRevealModal.tsx";
import { GameOverModal } from "./GameOverModal.tsx";
import { LuckChallengeModal } from "./LuckChallengeModal.tsx";
import type { MyData, GameData } from "../../../types/live-game.ts";
import { useGameUIStore } from "../../../store/useGameUIStore.ts";

interface GameOverlayManagerProps {
	roomId: string;
	me: MyData;
	game: GameData["game"];
	isMyTurn: boolean;
}

export function GameOverlayManager({
	roomId,
	me,
	game,
	isMyTurn,
}: GameOverlayManagerProps) {
	const navigate = useNavigate();

	// Extraemos el estado de la UI directamente desde Zustand
	const isFirstLoad = useGameStore((state) => state.isFirstLoad);
	const setIsFirstLoad = useGameStore((state) => state.setIsFirstLoad);
	const gameOver = useGameStore((state) => state.gameOver);
	const showActingBossModal = useGameStore(
		(state) => state.showActingBossModal,
	);
	const setShowActingBossModal = useGameStore(
		(state) => state.setShowActingBossModal,
	);
	const luckResult = useGameUIStore((state) => state.luckResult);
	const handleLuckResult = useGameUIStore((state) => state.handleLuckResult);

	const handleCloseGameOver = () => {
		localStorage.removeItem("game_token");
		useGameStore.getState().setRoomId(null);
		useGameStore.getState().resetStore();
		navigate("/");
	};

	return (
		<>
			{isFirstLoad && (
				<RoleRevealModal role={me.role} onClose={() => setIsFirstLoad(false)} />
			)}

			{showActingBossModal && (
				<RoleRevealModal
					role={me.role}
					isActingBoss={true}
					onClose={() => setShowActingBossModal(false)}
				/>
			)}

			{gameOver && (
				<GameOverModal
					winnerRole={game.winner_role}
					myRole={me.role}
					onClose={handleCloseGameOver}
				/>
			)}

			{isMyTurn && me.luck_challenge && luckResult === null && (
				<LuckChallengeModal
					roomId={roomId}
					colors={me.luck_challenge}
					onResult={handleLuckResult}
				/>
			)}
		</>
	);
}
