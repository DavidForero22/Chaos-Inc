import api from "../../api/axios.ts";

import { logWithTime } from "../../utils/logger.ts";

export function useGameActions(
	roomId: string | undefined,
	syncGame: () => Promise<void>,
) {
	const playTurn = async (cardId: string, targetName: string) => {
		if (!roomId) return;

		try {
			// Enviar la jugada al servidor
			await api.post(`/rooms/${roomId}/action`, {
				card_id: cardId,
				target_name: targetName,
			});

			// Sincronizar para ver los cambios (el Backend también avisará al resto por Sockets)
			await syncGame();
			return true;
		} catch (error: any) {
			logWithTime("useGameActions.ts -Error playing turn. ", error);
			alert(error.response?.data?.message || "Error al jugar la carta.");
			return false;
		}
	};

	const reactToAttack = async (
		reaction: "dodge" | "accept",
		cardId?: string,
	) => {
		if (!roomId) return;

		try {
			await api.post(`/rooms/${roomId}/react`, {
				reaction,
				card_id: cardId,
			});
			await syncGame();
			return true;
		} catch (error: any) {
			logWithTime("useGameActions.ts - Error reacting to attack. ", error);
			alert(error.response?.data?.message || "Error al reaccionar al ataque.");
			return false;
		}
	};

	const endTurn = async () => {
		if (!roomId) return;
		await api.post(`/rooms/${roomId}/end-turn`, {});
		await syncGame();
	};

	return { playTurn, endTurn, reactToAttack };
}
