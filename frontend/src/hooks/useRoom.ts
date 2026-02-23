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
	const isJoiningRef = useRef(true);
	const [needsPassword, setNeedsPassword] = useState(false);
	const [passwordError, setPasswordError] = useState("");

	const handleLeaveRoom = useCallback(async () => {
		if (!roomId) return;
		isLeavingRef.current = true;
		try {
			await api.post(`/rooms/${roomId}/leave`);
		} catch (error) {
			console.error("Error leaving room:", error);
		} finally {
			sessionStorage.removeItem("game_token");
			navigate("/");
		}
	}, [roomId, navigate]);

	const fetchRoomData = useCallback(async () => {
		if (!roomId) return;
		console.log("[PESTAÑA B] 🔄 Ejecutando fetchRoomData...");
		try {
			const res = await api.get("/rooms");
			const currentRoom = res.data.find((r: RoomData) => r.room_id === roomId);

			if (currentRoom) {
				console.log(
					"[PESTAÑA B] 📊 Datos recibidos del servidor:",
					currentRoom.players,
				);
				console.log("[PESTAÑA B] 🔍 Mi nombre es:", myPlayerName);
				console.log(
					"[PESTAÑA B] 🛑 Variables de control -> isJoining:",
					isJoining,
					"| isLeavingRef:",
					isLeavingRef.current,
				);

				const imStillInRoom = currentRoom.players.includes(myPlayerName);
				console.log(
					"[PESTAÑA B] 🤔 ¿Sigo en la lista de jugadores?",
					imStillInRoom,
				);

				// DETECTOR DE SALIDA EXTERNA
				if (!isJoiningRef.current && !isLeavingRef.current && !currentRoom.players.includes(myPlayerName)) {
					console.log(
						"[PESTAÑA B] 🚨 ¡CONDICIÓN CUMPLIDA! Debería expulsarme AHORA.",
					);
					alert("You are no longer in this room.");
					sessionStorage.removeItem("game_token");
					navigate("/");
					return;
				}

				setRoom(currentRoom);
				roomStatusRef.current = currentRoom.status;
			} else {
				console.log("[PESTAÑA B] ❌ La sala ya no existe en el servidor.");
				navigate("/");
			}
		} catch (error) {
			console.error("Error loading the room", error);
		}
	}, [roomId, navigate, myPlayerName, isJoining]);

	const attemptJoin = async (pwd = "") => {
		if (!roomId) return;
		try {
			setPasswordError("");
			const res = await api.post(`/rooms/${roomId}/join`, {
				player_name: myPlayerName,
				password: pwd,
			});

			if (res.data.game_token) {
				sessionStorage.setItem("game_token", res.data.game_token);
			}

			setNeedsPassword(false);
			setIsJoining(false);
			isJoiningRef.current = false;
			console.log("[PESTAÑA B] ✅ Unión completada. isJoining pasa a FALSE.");
			fetchRoomData();
		} catch (error: any) {
			const errorType = error.response?.data?.type;
			const errorMsg = error.response?.data?.error;

			if (errorType === "ROOM_FULL") {
				alert("The room is full.");
				navigate("/");
				return;
			}

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

			if (errorType === "GAME_ALREADY_STARTED") {
				alert("The game has already begun.");
				navigate("/");
				return;
			}

			alert(errorMsg || "You cannot access this room.");
			navigate("/");
		}
	};

	const startGame = async () => {
		if (!roomId) return;
		try {
			await api.post(`/rooms/${roomId}/start`);
		} catch (error: any) {
			alert(error.response?.data?.error || "Error starting the game.");
		}
	};

	const kickPlayer = async (playerToKick: string) => {
		if (!roomId) return;
		try {
			await api.post(`/rooms/${roomId}/kick`, {
				player_to_kick: playerToKick,
			});
		} catch (error: any) {
			alert(error.response?.data?.error || "The player could not be sent off.");
		}
	};

	useEffect(() => {
		attemptJoin();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [roomId]);

	useEffect(() => {
		if (isJoining || needsPassword || !roomId) return;
		console.log("[PESTAÑA B] 🎧 Suscribiendo a Echo para la sala:", roomId);
		const channel = echo.channel(`room.${roomId}`);

		channel.listen(".RoomListUpdated", () => {
			console.log(
				"[PESTAÑA B] 🔔 ¡EVENTO ECHO RECIBIDO! Alguien entró o salió.",
			);
			fetchRoomData();
		});
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
				data.append("game_token", sessionStorage.getItem("game_token") || "");
				navigator.sendBeacon(leaveUrl, data);
			}
		};

		window.addEventListener("beforeunload", handleUnload);
		return () => window.removeEventListener("beforeunload", handleUnload);
	}, [roomId]);

	// LISTENER MEJORADO PARA EL LOGOUT MULTIPESTAÑA
	useEffect(() => {
		const handleStorageChange = (e: StorageEvent) => {
			console.log(
				"[PESTAÑA B] 🗄️ Evento Storage detectado! Key:",
				e.key,
				"| Nuevo valor:",
				e.newValue,
			);
			if (e.key === "user" && !e.newValue) {
				console.warn("[PESTAÑA B] ⚠️ Cierre de sesión detectado vía storage.");
				handleLeaveRoom();
			}
		};

		window.addEventListener("storage", handleStorageChange);

		if (myPlayerName && !user && !sessionStorage.getItem("guestName")) {
			console.warn("[PESTAÑA B] ⚠️ Cierre de sesión local detectado.");
			handleLeaveRoom();
		}

		return () => window.removeEventListener("storage", handleStorageChange);
	}, [user, myPlayerName, handleLeaveRoom]);

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
