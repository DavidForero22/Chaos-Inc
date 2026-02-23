import { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api/axios";

// Tipado de los datos públicos (lo que ves de los demás)
export interface PublicPlayer {
	name: string;
	stress: number;
	is_dead: number;
	role: string; // Puede ser 'boss' o 'hidden'
}

// Tipado de TUS datos (lo que te devuelve el sync)
export interface GameData {
	role: string;
	stress: number;
	is_dead: number;
	cards: number[];
	current_turn: string;
	players_info: PublicPlayer[];
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
