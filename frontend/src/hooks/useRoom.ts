import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import type { RoomData } from "../types/types.ts";
import { usePlayerIdentity } from "./usePlayerIdentity.ts";
import { useRoomSockets } from "./useRoomSockets.ts";

export function useRoom(roomId: string | undefined) {
	const navigate = useNavigate();
	const { myPlayerName, user } = usePlayerIdentity();

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
		try {
			const res = await api.get("/rooms");
			const currentRoom = res.data.find((r: RoomData) => r.room_id === roomId);

			if (currentRoom) {
				const imStillInRoom =
					currentRoom.players?.includes(myPlayerName) ?? false;

				if (!isJoiningRef.current && !isLeavingRef.current && !imStillInRoom) {
					alert("You are no longer in this room.");
					sessionStorage.removeItem("game_token");
					navigate("/");
					return;
				}

				setRoom(currentRoom);
				roomStatusRef.current = currentRoom.status;
			} else {
				navigate("/");
			}
		} catch (error) {
			console.error("Error loading the room", error);
		}
	}, [roomId, navigate, myPlayerName]);

	const attemptJoin = useCallback(
		async (pwd = "") => {
			if (!roomId) return;
			try {
				setPasswordError("");
				const res = await api.post(`/rooms/${roomId}/join`, {
					player_name: myPlayerName,
					password: pwd,
				});

				if (res.data.game_token)
					sessionStorage.setItem("game_token", res.data.game_token);

				setNeedsPassword(false);
				setIsJoining(false);
				isJoiningRef.current = false;
				fetchRoomData();
			} catch (error: any) {
				const errorType = error.response?.data?.type;
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
					if (errorType === "INCORRECT_PASSWORD")
						setPasswordError("Incorrect password. Please try again.");
					setIsJoining(false);
					return;
				}
				if (errorType === "GAME_ALREADY_STARTED") {
					alert("The game has already begun.");
					navigate("/");
					return;
				}

				alert(error.response?.data?.error || "You cannot access this room.");
				navigate("/");
			}
		},
		[roomId, myPlayerName, fetchRoomData, navigate],
	);

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
			await api.post(`/rooms/${roomId}/kick`, { player_to_kick: playerToKick });
		} catch (error: any) {
			alert(error.response?.data?.error || "The player could not be sent off.");
		}
	};

	// Montaje inicial
	useEffect(() => {
		attemptJoin();
	}, [attemptJoin]);

	// Lógica de WebSockets extraída
	useRoomSockets({
		roomId,
		isJoining,
		needsPassword,
		myPlayerName,
		fetchRoomData,
	});

	// Protección al cerrar ventana
	useEffect(() => {
		const handleUnload = () => {
			if (roomStatusRef.current === "waiting" && roomId) {
				const data = new URLSearchParams();
				data.append("game_token", sessionStorage.getItem("game_token") || "");
				navigator.sendBeacon(
					`${api.defaults.baseURL}/rooms/${roomId}/leave`,
					data,
				);
			}
		};
		window.addEventListener("beforeunload", handleUnload);
		return () => window.removeEventListener("beforeunload", handleUnload);
	}, [roomId]);

	// Listener de sesión multipestaña
	useEffect(() => {
		const handleStorageChange = (e: StorageEvent) => {
			if (e.key === "user" && !e.newValue) handleLeaveRoom();
		};
		window.addEventListener("storage", handleStorageChange);
		if (myPlayerName && !user && !sessionStorage.getItem("guestName"))
			handleLeaveRoom();
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
