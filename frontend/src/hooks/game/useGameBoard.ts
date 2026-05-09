import { useGameStore } from "../../store/useGameStore.ts";
import { useAuth } from "../useAuth.ts";
import { useGameUIStore } from "../../store/useGameUIStore.ts";

export function useGameBoard() {
	const { user, id: myId } = useAuth();

	// Extraer todo del Store
	const gameData = useGameStore((state) => state.gameData);
	const endTurn = useGameStore((state) => state.endTurn);
	const reactToAttack = useGameStore((state) => state.reactToAttack);
	const reactToMultiAttack = useGameStore((state) => state.reactToMultiAttack);
	const discardCards = useGameStore((state) => state.discardCards);
	const resolveSabotage = useGameStore((state) => state.resolveSabotage);

	// UI Store
	const selectedCardId = useGameUIStore((state) => state.selectedCardId);
	const luckResult = useGameUIStore((state) => state.luckResult);

	// Variables derivadas (protegidas por un early return si gameData no existe)
	const me = gameData?.me;
	const game = gameData?.game;

	const isMyTurn = String(game?.current_turn) === String(myId);
	const hasPendingAttack = me?.combat_state.is_attacking_single ?? false;
	const hasPendingMultiAttack = me?.combat_state.is_defending_multi ?? false;
	const isAttackerWaiting = me?.combat_state.is_attacking_multi ?? false;
	const isTurnFrozen = game?.ending_soon || game?.effectively_over;
	const hasLuckChallenge =
		isMyTurn && !!me?.luck_challenge && luckResult === null;
	const hasPendingSabotage =
		!!game?.player_pending_sabotage &&
		String(game?.player_pending_sabotage) !== String(myId);

	const handleEndTurn = async () => {
		if (
			!isMyTurn ||
			selectedCardId !== null ||
			hasPendingAttack ||
			hasLuckChallenge ||
			isAttackerWaiting
		)
			return;

		await endTurn();
	};

	return {
		user,
		gameData,
		me,
		game,
		isMyTurn,
		hasPendingAttack,
		hasPendingMultiAttack,
		isAttackerWaiting,
		isTurnFrozen,
		hasLuckChallenge,
		hasPendingSabotage,
		handleEndTurn,
		reactToAttack,
		reactToMultiAttack,
		discardCards,
		resolveSabotage,
	};
}
