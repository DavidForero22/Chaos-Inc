import { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api/axios";

// Tipado de los oponentes
export interface Opponent {
	name: string;
	stress: number;
	is_dead: boolean;
	role: "boss" | "hidden";
}

// Tipado de mis datos privados
export interface MyData {
	name: string;
	role: "boss" | "secretary" | "intern" | " union";
	stress: number;
	is_dead: boolean;
	cards: number[];
}

// Tipado general de la respuesta del sync
export interface GameData {
	me: MyData;
	game: {
		current_turn: string;
		opponents: Opponent[];
	};
}

export function useLiveGame(roomId: string | undefined) {
	const navigate = useNavigate();
	const location = useLocation();

	// Recuperamos identidad
	const myPlayerName =
		location.state?.playerName || sessionStorage.getItem("guestName");

	const [gameData, setGameData] = useState<GameData | null>(null);
	const [loading, setLoading] = useState(true);

	const syncGame = useCallback(async () => {
		if (!roomId) return;

		try {
			const res = await api.post(`/rooms/${roomId}/sync`);
			setGameData(res.data);
			setLoading(false);
		} catch (error: any) {
			const errorType = error.response?.data?.type;

			if (errorType === "GAME_NOT_STARTED") {
				console.warn("Waiting for Redis initialization...");
				return;
			}

			console.error("Error synchronizing game:", error);
			if (error.response?.status === 401) {
				alert("Game session expired.");
			}
			navigate("/");
			setLoading(false);
		}
	}, [roomId, navigate]);

	useEffect(() => {
		if (!sessionStorage.getItem("game_token")) {
			navigate("/");
			return;
		}
		syncGame();
	}, [syncGame, navigate]);

	return {
		gameData,
		loading,
		myPlayerName,
	};
}
