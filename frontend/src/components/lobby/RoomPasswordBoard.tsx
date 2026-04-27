// src/components/lobby/RoomPasswordBoard.tsx

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

	return (
		<WallLayout boardWidth="500px">
			<div className="text-center">
				<h2
					className={`${styles.markerRed} text-3xl font-bold mb-4`}
					style={{ fontFamily: "'Kalam', cursive" }}
				>
					SALA CERRADA
				</h2>
				<p
					className={`${styles.markerBlack} mb-6 font-bold text-lg`}
					style={{ fontFamily: "'Kalam', cursive" }}
				>
					Clave de acceso para la sala: <br />
					<span className={styles.markerBlue}>{roomId}</span>
				</p>

				<input
					type="password"
					className="w-full p-3 mb-2 border-2 border-gray-400 rounded outline-none focus:border-blue-600 font-mono text-center text-xl bg-transparent"
					placeholder="••••••••"
					value={passwordInput}
					onChange={(e) => setPasswordInput(e.target.value)}
					onKeyDown={(e) => e.key === "Enter" && onSubmit(passwordInput)}
					autoFocus
				/>

				{error && (
					<p className={`${styles.markerRed} text-sm mb-4 text-left font-bold`}>
						{error}
					</p>
				)}

				<div className="flex justify-between gap-3 mt-8 border-t-2 border-gray-200 pt-6">
					<button
						onClick={onCancel}
						className={`${styles.btnBase} ${styles.btnLeave}`}
					>
						Cancelar
					</button>
					<button
						onClick={() => onSubmit(passwordInput)}
						className={`${styles.btnBase} ${styles.btnStart}`}
					>
						Entrar
					</button>
				</div>
			</div>
		</WallLayout>
	);
}
