// src/hooks/useLobby.ts

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import echo from "../echo";
import type { RoomData } from "../types/api.ts";
import { useLoadingStore } from "../store/useLoadingStore";
import { useGameStore } from "../store/useGameStore";
import { useAuthStore } from "../store/useAuthStore.ts";

export function useLobby() {
	const [rooms, setRooms] = useState<RoomData[]>([]);
	const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
	const [filterStatus, setFilterStatus] = useState<
		"all" | "waiting" | "in_game"
	>("all");
	const [searchQuery, setSearchQuery] = useState("");

	// ESTADO LOCAL para RoomList
	const [isLoadingRooms, setIsLoadingRooms] = useState(true);

	const navigate = useNavigate();
	const { startLoading, stopLoading } = useLoadingStore();

	// -- ESTADO GLOBAL DE PARTIDA ACTIVA --
	const activeRoomId = useGameStore((state) => state.roomId);
	const setRoomId = useGameStore((state) => state.setRoomId);

	// -- VALIDAR SI LA SALA SIGUE ACTIVA --
	const checkActiveRoom = useCallback(async () => {
		const currentRoomId = useGameStore.getState().roomId;
		if (!currentRoomId) return;

		try {
			const response = await api.get(
				`/rooms/${encodeURIComponent(currentRoomId)}`,
				{ hideLoader: true } as any,
			);
			const roomData = response.data;

			// Si la sala está marcada como terminada, liberar al jugador
			if (roomData.status === "finished") {
				setRoomId(null);
			}
		} catch (error: any) {
			// Si da 404, significa que el backend ya borró la sala de Redis
			if (error.response?.status === 404) {
				setRoomId(null);
			}
		}
	}, [setRoomId]);

	// Ejecutar la comprobación la primera vez que carga el Lobby
	useEffect(() => {
		checkActiveRoom();
	}, [checkActiveRoom]);

	const fetchRooms = useCallback(async (showLocalLoader = false) => {
		// Solo activar el de RoomList
		if (showLocalLoader) setIsLoadingRooms(true);
		try {
			const response = await api.get("/rooms", { hideLoader: true } as any);
			const rooms: RoomData[] = response.data;
			setRooms(rooms);

			const currentRoomId = useGameStore.getState().roomId;
			const myName = useAuthStore.getState().user;

			if (myName) {
				const myRoom = rooms.find((room) => room.players?.includes(myName));

				if (myRoom && myRoom.room_id !== currentRoomId) {
					useGameStore.getState().setRoomId(myRoom.room_id);
				} else if (!myRoom && currentRoomId) {
					useGameStore.getState().setRoomId(null);
				}
			}
		} catch (error) {
			console.error("Error al cargar las salas:", error);
		} finally {
			if (showLocalLoader) setIsLoadingRooms(false);
		}
	}, []);

	useEffect(() => {
		fetchRooms(true);

		const channel = echo.channel("lobby");
		channel.listen(".RoomListUpdated", () => {
			fetchRooms(false);
			checkActiveRoom();
		});

		return () => {
			channel.stopListening(".RoomListUpdated");
			echo.leaveChannel("lobby");
		};
	}, [fetchRooms, checkActiveRoom]);

	const handleJoinRoom = async () => {
		if (!selectedRoom) return;
		const roomInfo = rooms.find((r) => r.room_id === selectedRoom);
		let password = "";

		if (roomInfo?.is_private === "1") {
			password = prompt("Esta sala es privada. Introduce la contraseña:") || "";
		}

		// Loader global bloqueante con mensaje
		startLoading("Entrando a la sala...");
		try {
			const response = await api.post(`/rooms/${selectedRoom}/join`, {
				password,
			});
			navigate(`/room/${selectedRoom}`, {
				state: { playerName: response.data.player },
			});
		} catch (error: any) {
			alert(error.response?.data?.error || "Error al unirse a la sala.");
		} finally {
			stopLoading();
		}
	};

	const filteredRooms = rooms.filter((room) => {
		// Filtrar por estado
		const matchesStatus =
			filterStatus === "all" || room.status === filterStatus;

		// Filtrar por nombre (búsqueda)
		const matchesSearch = room.name
			.toLowerCase()
			.includes(searchQuery.toLowerCase());

		return matchesStatus && matchesSearch;
	});

	return {
		rooms,
		filteredRooms,
		selectedRoom,
		setSelectedRoom,
		filterStatus,
		setFilterStatus,
		searchQuery,
		setSearchQuery,
		handleJoinRoom,
		isLoadingRooms,
		activeRoomId,
	};
}
