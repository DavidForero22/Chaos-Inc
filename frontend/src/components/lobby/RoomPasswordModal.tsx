// src/components/lobby/RoomPasswordModal.tsx

import { useState } from "react";
import ModalLayout from "../ui/Modals/ModalLayout";

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

	const handleSubmit = (e?: React.FormEvent) => {
		e?.preventDefault();
		if (passwordInput.trim()) {
			onSubmit(passwordInput);
		}
	};

	return (
		<ModalLayout
			title="SALA CERRADA"
			subtitle={`Clave de acceso para la sala: ${roomId}`}
			onClose={onCancel}
			onSubmit={handleSubmit}
			submitText="Entrar"
		>
			<div>
				<label htmlFor="room-password">
					Ingresa la contraseña para unirte a la sala
				</label>
				<input
					id="room-password"
					type="password"
					className="w-full p-3 border-2 border-gray-400 rounded outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-400 font-mono text-center text-xl bg-transparent"
					placeholder="••••••••"
					value={passwordInput}
					onChange={(e) => setPasswordInput(e.target.value)}
					autoFocus
					aria-required="true"
					minLength={8}
				/>
			</div>

			{error && (
				<p
					className="text-red-600 text-sm mt-5 font-bold text-center"
					role="alert"
					aria-live="polite"
				>
					⚠ {error}
				</p>
			)}
		</ModalLayout>
	);
}
