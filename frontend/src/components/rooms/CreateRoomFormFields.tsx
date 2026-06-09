// src/components/rooms/CreateRoomFormFields.tsx
import React from "react";
import styles from "../ui/Modals/ModalLayout.module.css";

interface FormData {
	name: string;
	is_private: boolean;
	password: string;
	keep_password: boolean;
	max_players: number;
	turn_timeout: number;
	is_debug: boolean;
}

interface CreateRoomFormFieldsProps {
	formData: FormData;
	setFormData: React.Dispatch<React.SetStateAction<FormData>>;
	isAdmin: boolean;
	isEditing: boolean;
	originalIsPrivate: boolean;
}

export default function CreateRoomFormFields({
	formData,
	setFormData,
	isAdmin,
	isEditing,
	originalIsPrivate,
}: CreateRoomFormFieldsProps) {
	return (
		<>
			{/* Campo 1: Nombre */}
			<div className={styles.fieldRow}>
				<span className={styles.annexNum}>1.</span>
				<div className={styles.fieldWrap}>
					<label
						className={`${styles.label} ${styles.labelFirst}`}
						htmlFor="room-name"
					>
						Nombre de la Sala
					</label>
					<input
						id="room-name"
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
					<label className={styles.label} id="privacy-label">
						Privacidad
					</label>

					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: "16px",
							marginTop: "8px",
						}}
					>
						{/* Checkbox: Sala Privada */}
						<label
							style={{
								display: "flex",
								alignItems: "center",
								gap: "8px",
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
								aria-labelledby="privacy-label"
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
						{/* Checkbox: Mantener Contraseña */}
						{isEditing && formData.is_private && originalIsPrivate && (
							<label
								style={{
									display: "flex",
									alignItems: "center",
									gap: "8px",
									cursor: "pointer",
								}}
							>
								<input
									type="checkbox"
									checked={formData.keep_password}
									onChange={(e) => {
										setFormData({
											...formData,
											keep_password: e.target.checked,
											password: e.target.checked ? "" : formData.password,
										});
									}}
									style={{ cursor: "pointer" }}
								/>
								<span
									style={{
										fontSize: "0.8rem",
										color: "#393e42",
										fontWeight: "bold",
									}}
								>
									Mantener contraseña
								</span>
							</label>
						)}{" "}
					</div>

					{/* Input de Contraseña */}
					{formData.is_private && (
						<div>
							<input
								id="room-password"
								className={styles.input}
								style={{
									marginTop: "8px",
									opacity: isEditing && formData.keep_password ? 0.5 : 1,
									cursor:
										isEditing && formData.keep_password
											? "not-allowed"
											: "text",
								}}
								type="password"
								placeholder="••••••••"
								// Solo es obligatorio si no esta editando, o si edita pero descarta "Mantener"
								required={!isEditing || !formData.keep_password}
								disabled={isEditing && formData.keep_password}
								minLength={8}
								maxLength={128}
								value={formData.password}
								onChange={(e) =>
									setFormData({ ...formData, password: e.target.value })
								}
								aria-label="Contraseña de la sala"
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
					<label className={styles.label} htmlFor="max-players">
						Aforo Máximo Permitido:{" "}
						<span style={{ color: "#295c60", fontSize: "0.9rem" }}>
							{`${formData.max_players} Jugadores`}
						</span>
					</label>
					<input
						id="max-players"
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
					<label className={styles.label} htmlFor="turn-timeout">
						Tiempo Límite de Turno:{" "}
						<span style={{ color: "#295c60", fontSize: "0.9rem" }}>
							{/* Mostrar el valor en segundos */}
							{`${formData.turn_timeout} Segundos`}
						</span>
					</label>
					<input
						id="turn-timeout"
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

			{/* Campo 5: Modo debug — solo visible para admins */}
			{isAdmin && (
				<div className={styles.fieldRow}>
					<span className={styles.annexNum}>5.</span>
					<div className={styles.fieldWrap}>
						<label className={styles.label} id="debug-label">
							Opciones de Administrador
						</label>
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
								onChange={(e) =>
									setFormData({ ...formData, is_debug: e.target.checked })
								}
								style={{ cursor: "pointer", accentColor: "#b45309" }}
								aria-labelledby="debug-label"
							/>
							<span
								style={{
									fontSize: "0.8rem",
									color: "#b45309",
									fontWeight: "bold",
								}}
							>
								Partida de Pruebas
							</span>
						</label>
						{formData.is_debug && (
							<p
								className={styles.hint}
								style={{ color: "#b45309", marginTop: "6px" }}
							>
								Tendrás acceso al menú de depuración y aparecerán registros por
								consola.
							</p>
						)}
					</div>
				</div>
			)}
		</>
	);
}
