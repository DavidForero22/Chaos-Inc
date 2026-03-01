import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../api/axios";
import type { RoomData } from "../../types/types";

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
		console.log("myPlayerNameRef.current ha cambiado a" + myPlayerName);
	}, [myPlayerName]);

	const handleLeaveRoom = useCallback(async () => {
		if (!roomId) return;
		isLeavingRef.current = true;
		console.log("Saliendo de la sala...");

		const gameToken = sessionStorage.getItem("game_token");

		try {
			await api.post(
				`/rooms/${roomId}/leave`,
				{},
				{ headers: { "X-Game-Token": gameToken } },
			);
		} catch (error) {
			console.error("Error leaving room:", error);
		} finally {
			alert("Te has salido de la sala.")
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
				// Solo verificamos si está en la sala si REALMENTE tenemos un nombre que buscar.
				// Si myPlayerNameRef está null, es porque React aún está cargando la sesión. No echar al jugador.
				if (
					myPlayerNameRef.current &&
					!isJoiningRef.current &&
					!isLeavingRef.current
				) {
					const imStillInRoom =
						currentRoom.players?.includes(myPlayerNameRef.current) ?? false;
					if (!imStillInRoom) {
						alert("You are no longer in this room.");
						sessionStorage.removeItem("game_token");
						navigate("/");
						return;
					}
				}

				setRoom(currentRoom);
				roomStatusRef.current = currentRoom.status;

				// Si la sala está en partida, PERO está en la ruta de WaitingRoom (/room/ABCD),
				// mandar al tablero automáticamente.
				if (
					currentRoom.status === "in_game" &&
					location.pathname.includes(`/room/`)
				) {
					alert(`Redireccionando a tablero. ${myPlayerNameRef}, ${isJoiningRef}, ${isLeavingRef}, ${currentRoom}`)
					console.log("La partida ya empezó, redirigiendo al tablero...");
					navigate(`/game/${roomId}`, {
						state: { playerName: myPlayerNameRef.current },
						replace: true,
					});
					return;
				}
			} else {
				alert(`Redireccionando a lobby. ${myPlayerNameRef}, ${isJoiningRef}, ${isLeavingRef}, ${currentRoom}`)
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
					player_name: myPlayerName,
					password: pwd,
				});

				if (res.data.game_token)
					sessionStorage.setItem("game_token", res.data.game_token);

				setNeedsPassword(false);
				setIsJoining(false);
				isJoiningRef.current = false;

				await fetchRoomData();
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
			} finally {
				isAttemptingRef.current = false;
			}
		},
		[roomId, myPlayerName, fetchRoomData, navigate],
	);

	// Montaje inicial
	useEffect(() => {
		console.log("Montaje inicial de useRoomSession...");
		if (myPlayerName && isJoiningRef.current) {
			attemptJoin();
		} else if (!myPlayerName) {
			setIsJoining(false);
		}
	}, [myPlayerName, attemptJoin]);

	// Protección al cerrar ventana
	useEffect(() => {
		console.log("Proteccion al cerrar vemtama...");
		const handleUnload = () => {
			if (isLeavingRef.current) return;
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
		console.log("Listener de sesion multipestaña...");
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
