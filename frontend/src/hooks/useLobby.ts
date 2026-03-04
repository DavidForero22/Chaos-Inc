import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import echo from "../echo";
import type { RoomData } from "../types/types.ts";
import { useAuthStore } from "../store/useAuthStore.ts";

export function useLobby() {
	const [rooms, setRooms] = useState<RoomData[]>([]);
	const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
	const [filterStatus, setFilterStatus] = useState<
		"all" | "waiting" | "in_game"
	>("all");

	const navigate = useNavigate();
	const { user } = useAuthStore();

	const fetchRooms = useCallback(async () => {
		try {
			const response = await api.get("/rooms");
			setRooms(response.data);
		} catch (error) {
			console.error("Error al cargar las salas:", error);
		}
	}, []);

	useEffect(() => {
		fetchRooms();
		const channel = echo.channel("lobby");
		channel.listen(".RoomListUpdated", fetchRooms);

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

		try {
			const response = await api.post(`/rooms/${selectedRoom}/join`, {
				password,
			});
			navigate(`/room/${selectedRoom}`, {
				state: { playerName: response.data.player },
			});
		} catch (error: any) {
			alert(error.response?.data?.error || "Error al unirse a la sala.");
		}
	};

	const filteredRooms = rooms.filter((room) => {
		if (filterStatus === "all") return true;
		return room.status === filterStatus;
	});

	return {
		rooms,
		filteredRooms,
		selectedRoom,
		setSelectedRoom,
		filterStatus,
		setFilterStatus,
		handleJoinRoom,
		user,
	};
}
