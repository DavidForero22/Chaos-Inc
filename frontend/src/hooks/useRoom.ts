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
	const isLeavingRef = useRef(false);
	const [isJoining, setIsJoining] = useState(true);
	const [needsPassword, setNeedsPassword] = useState(false);
	const [passwordError, setPasswordError] = useState("");

	const fetchRoomData = useCallback(async () => {
		if (!roomId) return;
		try {
			const res = await api.get("/rooms");
			const currentRoom = res.data.find((r: RoomData) => r.room_id === roomId);

			if (currentRoom) {
				// Si ya no está en la lista de jugadores y no se fue voluntariamente
				if (
					!isJoining &&
					!isLeavingRef.current &&
					!currentRoom.players.includes(myPlayerName)
				) {
					alert("You have been expelled from the room.");
					navigate("/");
					return;
				}

				setRoom(currentRoom);
				roomStatusRef.current = currentRoom.status;
			} else {
				navigate("/");
			}
		} catch (error) {
			console.error("Error loading the room");
		}
	}, [roomId, navigate, myPlayerName, isJoining]);

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
			const errorType = error.response?.data?.type;
			const errorMsg = error.response?.data?.error;

			// Sala llena
			if (errorType === "ROOM_FULL") {
				alert("The room is full.");
				navigate("/");
				return;
			}

			// Contraseñas
			if (
				errorType === "PASSWORD_REQUIRED" ||
				errorType === "INCORRECT_PASSWORD"
			) {
				setNeedsPassword(true);
				if (errorType === "INCORRECT_PASSWORD") {
					setPasswordError("Incorrect password. Please try again.");
				}
				setIsJoining(false);
				return;
			}

			// Partida ya iniciada
			if (errorType === "GAME_ALREADY_STARTED") {
				alert("The game has already begun.");
				navigate("/");
				return;
			}

			// CUALQUIER OTRO ERROR
			alert(errorMsg || "You cannot access this room.");
			navigate("/");
		}
	};

	const handleLeaveRoom = async () => {
		if (!roomId) return;

		isLeavingRef.current = true;

		try {
			await api.post(`/rooms/${roomId}/leave`, { player_name: myPlayerName });
			navigate("/");
		} catch (error) {
			navigate("/");
		}
	};

	// Función para iniciar la partida (La llamará el dueño)
	const startGame = async () => {
		if (!roomId) return;
		try {
			await api.post(`/rooms/${roomId}/start`, { player_name: myPlayerName });
		} catch (error: any) {
			alert(error.response?.data?.error || "Error starting the game.");
		}
	};

	const kickPlayer = async (playerToKick: string) => {
		if (!roomId) return;
		try {
			await api.post(`/rooms/${roomId}/kick`, {
				player_to_kick: playerToKick,
				admin_name: myPlayerName, // Por si es invitado, lo pasamos también
			});
			// No hace falta hacer nada más, fetchRoomData se disparará por el evento de Echo
		} catch (error: any) {
			alert(error.response?.data?.error || "The player could not be sent off.");
		}
	};

	useEffect(() => {
		attemptJoin();
	}, [roomId]);

	useEffect(() => {
		if (isJoining || needsPassword || !roomId) return;

		const channel = echo.channel(`room.${roomId}`);
		channel.listen(".RoomListUpdated", fetchRoomData);

		// NUEVO: Escuchar evento de inicio de partida
		channel.listen(".GameStarted", () => {
			console.log("The game has begun! Navigating to the board.");
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
		kickPlayer,
	};
}
