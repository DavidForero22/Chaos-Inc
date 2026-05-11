import { useNavigate } from "react-router-dom";
import { useGameStore } from "../../../store/useGameStore.ts";
import { RoleRevealModal } from "./RoleRevealModal.tsx";
import { GameOverModal } from "./GameOverModal.tsx";
import { LuckChallengeModal } from "./LuckChallengeModal.tsx";
import { DeathModal } from "./DeathModal.tsx";
import type { MyData, GameData } from "../../../types/live-game.ts";
import { useGameUIStore } from "../../../store/useGameUIStore.ts";
import { ActingBossModal } from "./ActingBossModal.tsx";
import { useEffect, useState } from "react";

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

	const [showDeathModal, setShowDeathModal] = useState(false);
	useEffect(() => {
		if (me.is_dead) {
			const deathModalKey = `death_modal_shown:${roomId}`;
			const hasShownDeathModal = localStorage.getItem(deathModalKey);

			if (!hasShownDeathModal) {
				setShowDeathModal(true);
				localStorage.setItem(deathModalKey, "1");
			}
		}
	}, [me.is_dead, roomId]);

	return (
		<>
			{isFirstLoad && (
				<RoleRevealModal role={me.role} onClose={() => setIsFirstLoad(false)} />
			)}

			{showActingBossModal && (
				<ActingBossModal onClose={() => setShowActingBossModal(false)} />
			)}

			{showDeathModal && (
				<DeathModal
					onClose={() => setShowDeathModal(false)}
					killerName={me.killer_name ?? undefined}
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
