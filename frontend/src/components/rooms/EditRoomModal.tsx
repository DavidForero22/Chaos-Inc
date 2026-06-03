import { useState } from "react";
import api from "../../api/axios";
import ModalLayout from "../ui/ModalLayout";
import styles from "../ui/ModalLayout.module.css";
import { useAuth } from "../../hooks/auth/useAuth";
import type { RoomData } from "../../types/api";
import CreateRoomFormFields from "./CreateRoomFormFields";

interface EditRoomModalProps {
	room: RoomData;
	onClose: () => void;
}

export default function EditRoomModal({ room, onClose }: EditRoomModalProps) {
	const { role } = useAuth();
	const isAdmin = role === "admin";

	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");

	const [formData, setFormData] = useState({
		name: room.name,
		is_private: room.is_private,
		password: "",
		max_players: room.max_players,
		turn_timeout: room.turn_timeout,
		is_debug: room.is_debug || false,
	});

	const handleUpdateRoom = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setIsLoading(true);
		try {
			await api.put(`/rooms/${room.room_id}`, formData);
			onClose();
		} catch (err: any) {
			setError(
				err.response?.data?.error || "Hubo un error al actualizar la sala.",
			);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<ModalLayout
			title="Editar Sala"
			subtitle="Modificación de Reserva — Anexo S-4B"
			onClose={onClose}
			onSubmit={handleUpdateRoom}
			isLoading={isLoading}
			submitText="Guardar Cambios"
			loadingText="Guardando..."
		>
			<CreateRoomFormFields
				formData={formData}
				setFormData={setFormData}
				isAdmin={isAdmin}
				isEditing={true}
			/>

			{error && (
				<p className={styles.error} role="alert">
					⚠ {error}
				</p>
			)}
		</ModalLayout>
	);
}
