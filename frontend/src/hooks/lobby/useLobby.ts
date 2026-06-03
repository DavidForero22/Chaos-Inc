// src/hooks/useLobby.ts
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import type { RoomData } from "../../types/api";
import { useLoadingStore } from "../../store/ui/useLoadingStore";
import { useRoomStore } from "../../store/room/useRoomStore";
import { useAuthStore } from "../../store/auth/useAuthStore";
import { useLobbySocket } from "./useLobbySockets";

export function useLobby() {
	const [rooms, setRooms] = useState<RoomData[]>([]);
	const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
	const [filterStatus, setFilterStatus] = useState<
		"all" | "waiting" | "in_game"
	>("all");
	const [searchQuery, setSearchQuery] = useState("");
	const [isLoadingRooms, setIsLoadingRooms] = useState(true);

	const navigate = useNavigate();
	const { startLoading, stopLoading } = useLoadingStore();

	// Estado global de sala activa
	const activeRoomId = useRoomStore((state) => state.roomId);
	const setRoomId = useRoomStore((state) => state.setRoomId);
	const [isValidatingRoom, setIsValidatingRoom] = useState(
		!!useRoomStore.getState().roomId,
	);

	// --- Validar si la sala activa sigue existiendo ---
	const checkActiveRoom = useCallback(async () => {
		const state = useRoomStore.getState();
		const currentRoomId = state.roomId;
		const isJoining = state.isJoining;

		if (!currentRoomId || isJoining) {
			setIsValidatingRoom(false);
			return;
		}

		try {
			const response = await api.get(
				`/rooms/${encodeURIComponent(currentRoomId)}`,
				{
					hideLoader: true,
				} as any,
			);
			const roomData = response.data;

			if (roomData.status === "finished") {
				setRoomId(null);
			}
		} catch (error: any) {
			if (error.response?.status === 404) {
				setRoomId(null);
			}
		} finally {
			setIsValidatingRoom(false);
		}
	}, [setRoomId]);

	// Carga inicial de salas
	const fetchRooms = useCallback(
		async (showLocalLoader = false) => {
			if (showLocalLoader) setIsLoadingRooms(true);
			try {
				const response = await api.get("/rooms", { hideLoader: true } as any);
				const newRooms: RoomData[] = response.data;
				setRooms(newRooms);

				// Limpiar selección si la sala ya no está disponible
				setSelectedRoom((current) => {
					if (!current) return null;
					const room = newRooms.find((r) => r.room_id === current);
					if (!room || (room.players?.length ?? 0) >= room.max_players) {
						return null;
					}
					return current;
				});

				// Sincronizar roomId si el jugador aparece en otra sala (ej: otra pestaña)
				const myId = useAuthStore.getState().id;
				if (myId) {
					const myRoom = newRooms.find((room) =>
						room.players?.some((player) => String(player.id) === String(myId)),
					);
					const currentRoomId = useRoomStore.getState().roomId;
					if (myRoom && myRoom.room_id !== currentRoomId) {
						setRoomId(myRoom.room_id);
					}
				}
			} catch (error) {
				console.error("Error al cargar las salas:", error);
			} finally {
				if (showLocalLoader) setIsLoadingRooms(false);
			}
		},
		[setRoomId],
	);

	// Validar sala activa al montar
	useEffect(() => {
		checkActiveRoom();
	}, [checkActiveRoom]);

	// Cargar salas al montar (solo la primera vez)
	useEffect(() => {
		fetchRooms(true);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Escuchar actualizaciones del lobby vía WebSocket
	const handleRoomListUpdated = useCallback(() => {
		fetchRooms(false);
		checkActiveRoom();
	}, [fetchRooms, checkActiveRoom]);

	useLobbySocket({ onRoomListUpdated: handleRoomListUpdated });

	// Unirse a una sala
	const handleJoinRoom = async (password: string = "") => {
		if (!selectedRoom) return;

		startLoading("Entrando a la sala...");
		try {
			const response = await api.post(`/rooms/${selectedRoom}/join`, {
				password,
			});
			navigate(`/rooms/${selectedRoom}`, {
				state: { playerName: response.data.player },
			});
		} catch (error: any) {
			console.log(error.response);
			throw error;
		} finally {
			stopLoading();
		}
	};

	// Filtrado de salas
	const filteredRooms = rooms.filter((room) => {
		const matchesStatus =
			filterStatus === "all" || room.status === filterStatus;
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
