// src/components/rooms/CreateRoomModal.tsx
// Accesibilidad comprobada: SI

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import ModalLayout from "../ui/ModalLayout";
import styles from "../ui/ModalLayout.module.css";
import { useAuth } from "../../hooks/auth/useAuth";
import { useRoomStore } from "../../store/room/useRoomStore.ts";
import { logWithTime } from "../../utils/logger";
import CreateRoomFormFields from "./CreateRoomFormFields";

interface CreateRoomModalProps {
	onClose: () => void;
	user: string;
}

export default function CreateRoomModal({ onClose }: CreateRoomModalProps) {
	const navigate = useNavigate();
	const { role } = useAuth();
	const isAdmin = role === "admin";

	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");
	const [formData, setFormData] = useState({
		name: "",
		is_private: false,
		password: "",
		keep_password: false,
		max_players: 4,
		turn_timeout: 80,
		is_debug: false,
	});

	const handleCreateRoom = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setIsLoading(true);
		try {
			const response = await api.post("/rooms", formData);
			localStorage.setItem("game_token", response.data.game_token);
			useRoomStore.getState().setRoomId(response.data.room_id);

			const rawRoomData = response.data;
			logWithTime(
				"CreateRoomModal.tsx::handleCreateRoom() - Creando sala.",
				rawRoomData,
				"info",
			);

			useRoomStore.setState({
				roomId: response.data.room_id,
				hasToken: true,
				room: rawRoomData,
				isJoining: false,
			});

			onClose();
			navigate("/rooms");
		} catch (err: any) {
			console.log(err.response);
			setError("Hubo un error al crear la sala.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<ModalLayout
			title="Chaos Inc."
			subtitle="Formulario de Reserva de Sala — Anexo S-4"
			onClose={onClose}
			onSubmit={handleCreateRoom}
			isLoading={isLoading}
			submitText="Crear Sala"
			loadingText="Aprobando..."
		>
			<CreateRoomFormFields
				formData={formData}
				setFormData={setFormData}
				isAdmin={isAdmin}
				isEditing={false}
				originalIsPrivate={false}
			/>

			{error && (
				<p className={styles.error} role="alert">
					⚠ {error}
				</p>
			)}
		</ModalLayout>
	);
}
