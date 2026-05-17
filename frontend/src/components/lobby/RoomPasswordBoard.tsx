// src/components/lobby/RoomPasswordBoard.tsx
// Accesibilidad comprobada: SI

import { useState } from "react";
import WallLayout from "../../layouts/WallLayout";
import styles from "./RoomPasswordBoard.module.css";

interface RoomPasswordBoardProps {
	roomId: string;
	error: string;
	onCancel: () => void;
	onSubmit: (password: string) => void;
}

export default function RoomPasswordBoard({
	roomId,
	error,
	onCancel,
	onSubmit,
}: RoomPasswordBoardProps) {
	const [passwordInput, setPasswordInput] = useState("");

	const handleSubmit = () => {
		if (passwordInput.trim()) {
			onSubmit(passwordInput);
		}
	};

	return (
		<WallLayout boardWidth="500px">
			<div className="text-center">
				<h1
					className={`${styles.markerRed} text-3xl font-bold mb-4`}
					style={{ fontFamily: "'Kalam', cursive" }}
				>
					SALA CERRADA
				</h1>
				<p
					className={`${styles.markerBlack} mb-6 font-bold text-lg`}
					style={{ fontFamily: "'Kalam', cursive" }}
				>
					Clave de acceso para la sala: <br />
					<span
						className={styles.markerBlue}
						aria-label={`Identificador de sala: ${roomId}`}
					>
						{roomId}
					</span>
				</p>

				<form
					onSubmit={(e) => {
						e.preventDefault();
						handleSubmit();
					}}
				>
					<div className="mb-4">
						<label
							htmlFor="room-password"
							className="block text-sm font-bold mb-2 sr-only"
						>
							Ingresa la contraseña de la sala
						</label>
						<input
							id="room-password"
							type="password"
							className="w-full p-3 mb-2 border-2 border-gray-400 rounded outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-400 font-mono text-center text-xl bg-transparent"
							placeholder="••••••••"
							value={passwordInput}
							onChange={(e) => setPasswordInput(e.target.value)}
							autoFocus
							aria-required="true"
							aria-describedby={error ? "password-error" : undefined}
						/>
					</div>

					{error && (
						<p
							id="password-error"
							className={`${styles.markerRed} text-sm mb-4 text-left font-bold`}
							role="alert"
							aria-live="polite"
						>
							⚠ {error}
						</p>
					)}

					<div className="flex justify-between gap-3 mt-8 border-t-2 border-gray-200 pt-6">
						<button
							type="button"
							onClick={onCancel}
							className={`${styles.btnBase} ${styles.btnLeave}`}
							aria-label="Cancelar y volver atrás"
						>
							Cancelar
						</button>
						<button
							type="submit"
							onClick={handleSubmit}
							className={`${styles.btnBase} ${styles.btnStart}`}
							aria-label={`Entrar a la sala ${roomId} con la contraseña ingresada`}
							disabled={!passwordInput.trim()}
						>
							Entrar
						</button>
					</div>
				</form>
			</div>
		</WallLayout>
	);
}
