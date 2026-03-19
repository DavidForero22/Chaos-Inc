// src/hooks/room/useRoomSession.ts

import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../api/axios";
import type { RoomData } from "../../types/api.ts";
import { logWithTime } from "../../utils/logger.ts";

interface UseRoomSessionProps {
	roomId: string | undefined;
	myPlayerName: string | null;
}

export function useRoomSession({ roomId, myPlayerName }: UseRoomSessionProps) {
	const navigate = useNavigate();
	const location = useLocation();

	const [room, setRoom] = useState<RoomData | null>(null);
	const [isJoining, setIsJoining] = useState(true);
	const [needsPassword, setNeedsPassword] = useState(false);
	const [passwordError, setPasswordError] = useState("");

	const roomStatusRef = useRef<string | null>(null);
	const isLeavingRef = useRef(false);
	const isJoiningRef = useRef(true);
	const isAttemptingRef = useRef(false);
	const myPlayerNameRef = useRef(myPlayerName);

	useEffect(() => {
		myPlayerNameRef.current = myPlayerName;
	}, [myPlayerName]);

	const handleLeaveRoom = useCallback(async () => {
		if (!roomId) return;
		isLeavingRef.current = true;

		try {
			// El interceptor de Axios inyecta el X-Game-Token y el Bearer Token automáticamente
			await api.post(`/rooms/${roomId}/leave`);
		} catch (error) {
			console.error("Error leaving room:", error);
		} finally {
			logWithTime("useRoomSession.ts::handleLeaveRoom - Te has salido de la sala.", null);
			localStorage.removeItem("game_token");
			navigate("/");
		}
	}, [roomId, navigate]);

	const fetchRoomData = useCallback(async () => {
		if (!roomId) return;
		try {
			const res = await api.get("/rooms");
			const currentRoom = res.data.find((r: RoomData) => r.room_id === roomId);

			if (currentRoom) {
				if (
					myPlayerNameRef.current &&
					!isJoiningRef.current &&
					!isLeavingRef.current
				) {
					const imStillInRoom =
						currentRoom.players?.includes(myPlayerNameRef.current) ?? false;
					if (!imStillInRoom) {
						alert("Ya no estás en esta sala.");
						localStorage.removeItem("game_token");
						navigate("/");
						return;
					}
				}

				setRoom(currentRoom);
				roomStatusRef.current = currentRoom.status;

				if (
					currentRoom.status === "in_game" &&
					location.pathname.includes(`/room/`)
				) {
					navigate(`/game/${roomId}`, {
						state: { playerName: myPlayerNameRef.current },
						replace: true,
					});
					return;
				}
			} else {
				navigate("/");
			}
		} catch (error) {
			console.error("Error loading the room", error);
		}
	}, [roomId, navigate, location.pathname]);

	const attemptJoin = useCallback(
		async (pwd = "") => {
			if (!roomId || !myPlayerName) return;
			if (isAttemptingRef.current) return;

			isAttemptingRef.current = true;

			try {
				setPasswordError("");

				const res = await api.post(`/rooms/${roomId}/join`, {
					password: pwd,
				});

				if (res.data.game_token) {
					localStorage.setItem("game_token", res.data.game_token);
				}

				setNeedsPassword(false);
				setIsJoining(false);
				isJoiningRef.current = false;

				await fetchRoomData();
			} catch (error: any) {
				const errorType = error.response?.data?.type;

				if (errorType === "ROOM_FULL") {
					alert("La sala está llena.");
					navigate("/");
					return;
				}
				if (
					errorType === "PASSWORD_REQUIRED" ||
					errorType === "INCORRECT_PASSWORD"
				) {
					setNeedsPassword(true);
					if (errorType === "INCORRECT_PASSWORD")
						setPasswordError("Contraseña incorrecta. Inténtalo de nuevo.");
					setIsJoining(false);
					return;
				}
				if (errorType === "GAME_ALREADY_STARTED") {
					alert("La partida ya ha comenzado.");
					navigate("/");
					return;
				}
				// Si salta el error de "Ya estás en otra sala" (ALREADY_IN_ANOTHER_ROOM), se mostrará aquí:
				alert(error.response?.data?.error || "No puedes acceder a esta sala.");
				navigate("/");
			} finally {
				isAttemptingRef.current = false;
			}
		},
		[roomId, myPlayerName, fetchRoomData, navigate],
	);

	// Montaje inicial
	useEffect(() => {
		if (myPlayerName && isJoiningRef.current) {
			attemptJoin();
		} else if (!myPlayerName) {
			setIsJoining(false);
		}
	}, [myPlayerName, attemptJoin]);

	// PROTECCIÓN AL CERRAR VENTANA 
    useEffect(() => {
        const handleUnload = () => {
            // Si ya está saliendo con el botón "Salir", no hacer nada
            if (isLeavingRef.current) return;

            // Solo disparar el abandono si está en la sala de espera
            if (roomStatusRef.current === "waiting" && roomId) {
                const sanctumToken = localStorage.getItem("token") || "";
                const gameToken = localStorage.getItem("game_token") || "";

                const baseUrl = api.defaults.baseURL;

                fetch(`${baseUrl}/rooms/${roomId}/leave`, {
                    method: "POST",
                    headers: {
                        "Accept": "application/json",
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${sanctumToken}`,
                        "X-Game-Token": gameToken,
                    },
                    keepalive: true, // ¡La magia!
                    body: JSON.stringify({}),
                }).catch(() => {});
            }
        };

        window.addEventListener("beforeunload", handleUnload);
        return () => window.removeEventListener("beforeunload", handleUnload);
    }, [roomId]);

	// Listener de sesión multipestaña
	useEffect(() => {
		const handleStorageChange = (e: StorageEvent) => {
			if (e.key === "user" && e.newValue === null) {
				handleLeaveRoom();
			}
		};
		window.addEventListener("storage", handleStorageChange);

		return () => window.removeEventListener("storage", handleStorageChange);
	}, [handleLeaveRoom]);

	return {
		room,
		isJoining,
		needsPassword,
		passwordError,
		attemptJoin,
		handleLeaveRoom,
		fetchRoomData,
		roomStatusRef,
	};
}
