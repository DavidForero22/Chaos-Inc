// src/hooks/useLobby.ts

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import echo from "../echo";
import type { RoomData } from "../types/api.ts";
import { useLoadingStore } from "../store/useLoadingStore";

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

	// ESTADO GLOBAL
	const { startLoading, stopLoading } = useLoadingStore();

	const fetchRooms = useCallback(async (showLocalLoader = false) => {
		// Solo activar el de RoomList
		if (showLocalLoader) setIsLoadingRooms(true);
		try {
			const response = await api.get("/rooms", { hideLoader: true } as any);
			setRooms(response.data);
		} catch (error) {
			console.error("Error al cargar las salas:", error);
		} finally {
			if (showLocalLoader) setIsLoadingRooms(false);
		}
	}, []);

	useEffect(() => {
		fetchRooms(true);

		const channel = echo.channel("lobby");
		channel.listen(".RoomListUpdated", () => fetchRooms(false));

		return () => {
			channel.stopListening(".RoomListUpdated");
			echo.leaveChannel("lobby");
		};
	}, [fetchRooms]);

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
			stopLoading(); // Apagamos el que encendimos arriba
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
	};
}
