// src/components/rooms/CreateRoomModal.tsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import ModalLayout from "../ui/ModalLayout";
import styles from "../ui/ModalLayout.module.css";
import { useGameStore } from "../../store/useGameStore";

interface CreateRoomModalProps {
	onClose: () => void;
	user: string;
}

export default function CreateRoomModal({
	onClose,
	user,
}: CreateRoomModalProps) {
	const navigate = useNavigate();
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");
	const [formData, setFormData] = useState({
		name: "",
		is_private: false,
		password: "",
		max_players: 4,
		turn_timeout: 80,
	});

	const handleCreateRoom = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setIsLoading(true);
		try {
			const response = await api.post("/rooms", formData);
			localStorage.setItem("game_token", response.data.game_token);
			useGameStore.getState().setRoomId(response.data.room_id);

			onClose();
			navigate(`/room/${response.data.room_id}`, {
				state: { playerName: user },
			});
		} catch (error) {
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
			{/* Campo 1: Nombre */}
			<div className={styles.fieldRow}>
				<span className={styles.annexNum}>1.</span>
				<div className={styles.fieldWrap}>
					<label className={`${styles.label} ${styles.labelFirst}`}>
						Nombre de la Sala
					</label>
					<input
						className={styles.input}
						type="text"
						placeholder="Escribe el nombre..."
						required
						minLength={3}
						maxLength={50}
						autoFocus
						value={formData.name}
						onChange={(e) => setFormData({ ...formData, name: e.target.value })}
					/>
				</div>
			</div>

			{/* Campo 2: Privacidad */}
			<div className={styles.fieldRow}>
				<span className={styles.annexNum}>2.</span>
				<div className={styles.fieldWrap}>
					<label className={styles.label}>Privacidad</label>
					<label
						style={{
							display: "flex",
							alignItems: "center",
							gap: "8px",
							marginTop: "8px",
							cursor: "pointer",
						}}
					>
						<input
							type="checkbox"
							checked={formData.is_private}
							onChange={(e) =>
								setFormData({ ...formData, is_private: e.target.checked })
							}
							style={{ cursor: "pointer" }}
						/>
						<span
							style={{
								fontSize: "0.8rem",
								color: "#393e42",
								fontWeight: "bold",
							}}
						>
							Sala Privada
						</span>
					</label>

					{formData.is_private && (
						<div>
							<input
								className={styles.input}
								style={{ marginTop: "8px" }}
								type="password"
								placeholder="Contraseña"
								required
								minLength={8}
								maxLength={128}
								value={formData.password}
								onChange={(e) =>
									setFormData({ ...formData, password: e.target.value })
								}
							/>
							<p className={styles.hint}>Mínimo 8 caracteres.</p>
						</div>
					)}
				</div>
			</div>

			{/* Campo 3: Aforo */}
			<div className={styles.fieldRow}>
				<span className={styles.annexNum}>3.</span>
				<div className={styles.fieldWrap}>
					<label className={styles.label}>
						Aforo Máximo Permitido:{" "}
						<span style={{ color: "#295c60", fontSize: "0.9rem" }}>
							{formData.max_players} Jugadores
						</span>
					</label>
					<input
						type="range"
						min="3"
						max="6"
						style={{ width: "100%", marginTop: "8px", accentColor: "#295c60" }}
						value={formData.max_players}
						onChange={(e) =>
							setFormData({
								...formData,
								max_players: parseInt(e.target.value),
							})
						}
					/>
				</div>
			</div>

			{/* Campo 4: Tiempo */}
			<div className={styles.fieldRow}>
				<span className={styles.annexNum}>4.</span>
				<div className={styles.fieldWrap}>
					<label className={styles.label}>
						Tiempo Límite de Turno:{" "}
						<span style={{ color: "#295c60", fontSize: "0.9rem" }}>
							{formData.turn_timeout}s
						</span>
					</label>
					<input
						type="range"
						min="60"
						max="120"
						step="5"
						style={{ width: "100%", marginTop: "8px", accentColor: "#295c60" }}
						value={formData.turn_timeout}
						onChange={(e) =>
							setFormData({
								...formData,
								turn_timeout: parseInt(e.target.value),
							})
						}
					/>
				</div>
			</div>

			{error && <p className={styles.error}>⚠ {error}</p>}
		</ModalLayout>
	);
}
