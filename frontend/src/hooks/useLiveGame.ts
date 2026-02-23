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
		if (!myPlayerName || !roomId) return;
		try {
			const res = await api.post(`/rooms/${roomId}/sync`, {
				player_name: myPlayerName,
			});
			setGameData(res.data);
		} catch (error) {
			console.error("Error sincronizando partida:", error);
			navigate("/");
		} finally {
			setLoading(false);
		}
	}, [roomId, myPlayerName, navigate]);

	useEffect(() => {
		if (!myPlayerName) {
			navigate("/");
			return;
		}
		syncGame();
	}, [syncGame, myPlayerName, navigate]);

	return {
		gameData,
		loading,
		myPlayerName,
	};
}
