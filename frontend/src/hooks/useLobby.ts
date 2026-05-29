// src/hooks/useLobby.ts

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import echo from "../echo";
import type { RoomData } from "../types/api.ts";
import { useLoadingStore } from "../store/ui/useLoadingStore.ts";
import { useRoomStore } from "../store/room/useRoomStore";
import { useAuthStore } from "../store/auth/useAuthStore.ts";

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

	// -- ESTADO GLOBAL DE SALA ACTIVA --
	// Ahora usamos useRoomStore en lugar de useGameStore
	const activeRoomId = useRoomStore((state) => state.roomId);
	const setRoomId = useRoomStore((state) => state.setRoomId);
	const [isValidatingRoom, setIsValidatingRoom] = useState(
		!!useRoomStore.getState().roomId,
	);

	// -- VALIDAR SI LA SALA SIGUE ACTIVA --
	const checkActiveRoom = useCallback(async () => {
		const currentRoomId = useRoomStore.getState().roomId;
		if (!currentRoomId) {
			setIsValidatingRoom(false);
			return;
		}

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
		} finally {
			setIsValidatingRoom(false);
		}
	}, [setRoomId]);

	// Ejecutar la comprobación la primera vez que carga el Lobby
	useEffect(() => {
		checkActiveRoom();
	}, [checkActiveRoom]);

	const fetchRooms = useCallback(async (showLocalLoader = false) => {
		if (showLocalLoader) setIsLoadingRooms(true);
		try {
			const response = await api.get("/rooms", { hideLoader: true } as any);
			const newRooms: RoomData[] = response.data;
			setRooms(newRooms);

			// --- Validar si la sala seleccionada sigue disponible ---
			setSelectedRoom((currentSelectedId) => {
				if (!currentSelectedId) return null; // Si no hay nada seleccionado, no hacer nada

				const selectedRoomData = newRooms.find(
					(r) => r.room_id === currentSelectedId,
				);

				// Si la sala ya no existe o se ha llenado, quitar la selección
				if (
					!selectedRoomData ||
					(selectedRoomData.players?.length || 0) >=
						selectedRoomData.max_players
				) {
					return null;
				}

				return currentSelectedId; // Si existe y tiene hueco, mantener
			});
			// -------------------------------------------------------------

			const currentRoomId = useRoomStore.getState().roomId;
			const myId = useAuthStore.getState().id;

			if (myId) {
				const myRoom = newRooms.find((room) =>
					room.players?.some((player) => String(player.id) === String(myId)),
				);

				if (myRoom && myRoom.room_id !== currentRoomId) {
					// Actualizar el roomId global con la sala donde realmente está el jugador
					useRoomStore.getState().setRoomId(myRoom.room_id);
				} else if (!myRoom && currentRoomId) {
					// El jugador ya no está en ninguna sala, limpiar el roomId
					useRoomStore.getState().setRoomId(null);
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
			navigate(`/rooms/${selectedRoom}`, {
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
		isValidatingRoom,
	};
}
