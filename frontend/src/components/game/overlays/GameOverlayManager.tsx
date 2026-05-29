// src/components/game/overlays/GameOverlayManager.tsx

import { useNavigate } from "react-router-dom";
import { useGameStore } from "../../../store/game/useGameStore.ts";
import { useRoomStore } from "../../../store/room/useRoomStore.ts";
import { RoleRevealModal } from "./RoleRevealModal.tsx";
import { GameOverModal } from "./game-over/GameOverModal.tsx";
import { LuckChallengeModal } from "./LuckChallengeModal.tsx";
import { DeathModal } from "./DeathModal.tsx";
import type { MyData, GameData } from "../../../types/live-game.ts";
import { useGameUIStore } from "../../../store/game/useGameUIStore.ts";
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

	// Estados movidos a sus stores correspondientes
	const isFirstLoad = useRoomStore((state) => state.isFirstLoad);
	const setIsFirstLoad = useRoomStore((state) => state.setIsFirstLoad);
	const gameOver = useGameStore((state) => state.gameOver);
	const showActingBossModal = useGameUIStore(
		(state) => state.showActingBossModal,
	);
	const setShowActingBossModal = useGameUIStore(
		(state) => state.setShowActingBossModal,
	);
	const luckResult = useGameUIStore((state) => state.luckResult);
	const handleLuckResult = useGameUIStore((state) => state.handleLuckResult);

	const handleCloseGameOver = () => {
		localStorage.removeItem("game_token");
		// Limpiar el roomId y resetear la sala
		useRoomStore.getState().resetRoomStore(false);
		navigate("/");
	};

	const effectiveRole = me.conditions?.acting_boss ? "boss" : me.role;
	const isActingBoss = me.conditions?.acting_boss === true;

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
					myRole={effectiveRole}
					isActingBoss={isActingBoss} 
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
