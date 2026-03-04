import api from "../../api/axios.ts";

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
			console.error("Error playing turn:", error);
			alert(error.response?.data?.message || "Error al jugar la carta.");
			return false;
		}
	};

	return {
		playTurn,
	};
}
