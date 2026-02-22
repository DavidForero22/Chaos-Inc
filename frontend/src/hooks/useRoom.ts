import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api/axios";
import echo from "../echo";
import { useAuthStore } from "../store/useAuthStore";

export interface RoomData {
	room_id: string;
	name: string;
	max_players: number;
	owner_name: string;
	status: string;
	players: string[];
}

export function useRoom(roomId: string | undefined) {
	const navigate = useNavigate();
	const location = useLocation();
	const { user } = useAuthStore();

	const [myPlayerName] = useState(() => {
		if (user) return user;
		if (location.state?.playerName) {
			sessionStorage.setItem("guestName", location.state.playerName);
			return location.state.playerName;
		}
		const savedGuest = sessionStorage.getItem("guestName");
		if (savedGuest) return savedGuest;

		const newGuest = `Anon_${Math.floor(Math.random() * 1000)}_${Date.now().toString().slice(-4)}`;
		sessionStorage.setItem("guestName", newGuest);
		return newGuest;
	});

	const [room, setRoom] = useState<RoomData | null>(null);
	const roomStatusRef = useRef<string | null>(null);
	const [isJoining, setIsJoining] = useState(true);
	const [needsPassword, setNeedsPassword] = useState(false);
	const [passwordError, setPasswordError] = useState("");

	const fetchRoomData = useCallback(async () => {
		if (!roomId) return;
		try {
			const res = await api.get("/rooms");
			const currentRoom = res.data.find((r: RoomData) => r.room_id === roomId);
			if (currentRoom) {
				setRoom(currentRoom);
				roomStatusRef.current = currentRoom.status;
			} else {
				navigate("/");
			}
		} catch (error) {
			console.error("Error cargando la sala");
		}
	}, [roomId, navigate]);

	const attemptJoin = async (pwd = "") => {
		if (!roomId) return;
		try {
			setPasswordError("");
			await api.post(`/rooms/${roomId}/join`, {
				player_name: myPlayerName,
				password: pwd,
			});

			setNeedsPassword(false);
			setIsJoining(false);
			fetchRoomData();
		} catch (error: any) {
			if (
				error.response?.status === 403 &&
				error.response.data.error.includes("Contraseña")
			) {
				setNeedsPassword(true);
				if (pwd !== "")
					setPasswordError("Contraseña incorrecta. Inténtalo de nuevo.");
				setIsJoining(false);
			} else {
				alert(error.response?.data?.error || "No puedes acceder a esta sala.");
				navigate("/");
			}
		}
	};

	const handleLeaveRoom = async () => {
		if (!roomId) return;
		try {
			await api.post(`/rooms/${roomId}/leave`, { player_name: myPlayerName });
			navigate("/");
		} catch (error) {
			navigate("/");
		}
	};

	// NUEVO: Función para iniciar la partida (La llamará el dueño)
	const startGame = async () => {
		if (!roomId) return;
		try {
			await api.post(`/rooms/${roomId}/start`, { player_name: myPlayerName });
		} catch (error: any) {
			alert(error.response?.data?.error || "Error al iniciar la partida.");
		}
	};

	useEffect(() => {
		attemptJoin();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [roomId]);

	useEffect(() => {
		if (isJoining || needsPassword || !roomId) return;

		const channel = echo.channel(`room.${roomId}`);
		channel.listen(".RoomListUpdated", fetchRoomData);

		// NUEVO: Escuchar evento de inicio de partida
		channel.listen(".GameStarted", () => {
			console.log("¡La partida ha comenzado! Navegando al tablero...");
			navigate(`/game/${roomId}`, { state: { playerName: myPlayerName } });
		});

		return () => {
			channel.stopListening(".RoomListUpdated");
			channel.stopListening(".GameStarted");
			echo.leaveChannel(`room.${roomId}`);
		};
	}, [roomId, isJoining, needsPassword, fetchRoomData, navigate, myPlayerName]);

	useEffect(() => {
		const handleUnload = () => {
			if (roomStatusRef.current === "waiting" && roomId) {
				const leaveUrl = `${api.defaults.baseURL}/rooms/${roomId}/leave`;
				const data = new URLSearchParams();
				data.append("player_name", myPlayerName);
				navigator.sendBeacon(leaveUrl, data);
			}
		};

		window.addEventListener("beforeunload", handleUnload);
		return () => window.removeEventListener("beforeunload", handleUnload);
	}, [roomId, myPlayerName]);

	return {
		room,
		myPlayerName,
		isJoining,
		needsPassword,
		passwordError,
		attemptJoin,
		handleLeaveRoom,
		startGame,
	};
}
