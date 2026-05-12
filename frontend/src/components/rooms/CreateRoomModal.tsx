// src/components/rooms/CreateRoomModal.tsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import ModalLayout from "../ui/ModalLayout";
import styles from "../ui/ModalLayout.module.css";
import { useGameStore } from "../../store/useGameStore";
import { useAuth } from "../../hooks/useAuth";

interface CreateRoomModalProps {
	onClose: () => void;
	user: string;
}

export default function CreateRoomModal({
	onClose,
	user,
}: CreateRoomModalProps) {
	const navigate = useNavigate();
	const { role } = useAuth();
	const isAdmin = role === "admin";

	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");
	const [formData, setFormData] = useState({
		name: "",
		is_private: false,
		password: "",
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
			useGameStore.getState().setRoomId(response.data.room_id);

			onClose();
			navigate(`/rooms/${response.data.room_id}`, {
				state: { playerName: user },
			});
		} catch {
			setError("Hubo un error al crear la sala.");
		} finally {
			setIsLoading(false);
		}
	};

	const lockedByDebug = formData.is_debug;

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
			<div
				className={styles.fieldRow}
				style={
					lockedByDebug ? { opacity: 0.4, pointerEvents: "none" } : undefined
				}
			>
				<span className={styles.annexNum}>2.</span>
				<div className={styles.fieldWrap}>
					<label className={styles.label}>
						Privacidad{" "}
						{lockedByDebug && (
							<span style={{ color: "#295c60", fontSize: "0.9rem" }}>
								— (modo prueba)
							</span>
						)}
					</label>
					<label
						style={{
							display: "flex",
							alignItems: "center",
							gap: "8px",
							marginTop: "8px",
							cursor: lockedByDebug ? "not-allowed" : "pointer",
						}}
					>
						<input
							type="checkbox"
							checked={formData.is_private}
							disabled={lockedByDebug}
							onChange={(e) =>
								setFormData({ ...formData, is_private: e.target.checked })
							}
							style={{ cursor: lockedByDebug ? "not-allowed" : "pointer" }}
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
								disabled={lockedByDebug}
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
			<div
				className={styles.fieldRow}
				style={
					lockedByDebug ? { opacity: 0.4, pointerEvents: "none" } : undefined
				}
			>
				<span className={styles.annexNum}>3.</span>
				<div className={styles.fieldWrap}>
					<label className={styles.label}>
						Aforo Máximo Permitido:{" "}
						<span style={{ color: "#295c60", fontSize: "0.9rem" }}>
							{lockedByDebug
								? "— (modo prueba)"
								: `${formData.max_players} Jugadores`}
						</span>
					</label>
					<input
						type="range"
						min="3"
						max="6"
						disabled={lockedByDebug}
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
			<div
				className={styles.fieldRow}
				style={
					lockedByDebug ? { opacity: 0.4, pointerEvents: "none" } : undefined
				}
			>
				<span className={styles.annexNum}>4.</span>
				<div className={styles.fieldWrap}>
					<label className={styles.label}>
						Tiempo Límite de Turno:{" "}
						<span style={{ color: "#295c60", fontSize: "0.9rem" }}>
							{lockedByDebug ? "— (modo prueba)" : `${formData.turn_timeout}s`}
						</span>
					</label>
					<input
						type="range"
						min="60"
						max="120"
						step="5"
						disabled={lockedByDebug}
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

			{/* Campo 5: Modo debug — solo visible para admins */}
			{isAdmin && (
				<div className={styles.fieldRow}>
					<span className={styles.annexNum}>5.</span>
					<div className={styles.fieldWrap}>
						<label className={styles.label}>Opciones de Administrador</label>
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
								checked={formData.is_debug}
								onChange={(e) => {
									const isDebugEnabled = e.target.checked;
									setFormData({
										...formData,
										is_debug: isDebugEnabled,
										...(isDebugEnabled
											? { is_private: false, password: "" }
											: {}),
									});
								}}
								style={{ cursor: "pointer", accentColor: "#b45309" }}
							/>
							<span
								style={{
									fontSize: "0.8rem",
									color: "#b45309",
									fontWeight: "bold",
								}}
							>
								Habilitar Partida de Prueba
							</span>
						</label>
						{formData.is_debug && (
							<p
								className={styles.hint}
								style={{ color: "#b45309", marginTop: "6px" }}
							>
								Partida exclusiva para testing. No se podrán unir otros
								jugadores. Los ajustes de aforo y tiempo quedan desactivados.
							</p>
						)}
					</div>
				</div>
			)}

			{error && <p className={styles.error}>⚠ {error}</p>}
		</ModalLayout>
	);
}
