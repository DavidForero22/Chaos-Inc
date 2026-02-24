import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

interface CreateRoomModalProps {
	onClose: () => void;
	user: string;
}

export default function CreateRoomModal({
	onClose,
	user,
}: CreateRoomModalProps) {
	const navigate = useNavigate();
	const [formData, setFormData] = useState({
		name: "",
		is_private: false,
		password: "",
		max_players: 4,
	});

	const handleCreateRoom = async () => {
		try {
			const response = await api.post("/rooms", formData);
			sessionStorage.setItem("game_token", response.data.game_token);
			
			onClose();
			navigate(`/room/${response.data.room_id}`, {
				state: { playerName: user },
			});
		} catch (error) {
			alert("Hubo un error al crear la sala.");
		}
	};

	return (
		<div className="fixed inset-0 bg-gray-900/90 flex items-center justify-center p-4 z-50">
			<div className="bg-gray-800 p-8 rounded-xl max-w-sm w-full border border-gray-700">
				<h2 className="text-xl font-bold mb-4 text-white">Configurar Sala</h2>
				<input
					type="text"
					placeholder="Nombre"
					className="w-full p-2 mb-3 bg-gray-900 rounded text-white"
					onChange={(e) => setFormData({ ...formData, name: e.target.value })}
				/>
				<label className="flex items-center gap-2 mb-3 text-white">
					<input
						type="checkbox"
						onChange={(e) =>
							setFormData({ ...formData, is_private: e.target.checked })
						}
					/>{" "}
					Privada
				</label>
				{formData.is_private && (
					<input
						type="password"
						placeholder="Contraseña"
						className="w-full p-2 mb-3 bg-gray-900 rounded text-white"
						onChange={(e) =>
							setFormData({ ...formData, password: e.target.value })
						}
					/>
				)}
				<label className="block text-white mb-4">
					Jugadores: {formData.max_players}
					<input
						type="range"
						min="3"
						max="6"
						className="w-full mt-2"
						value={formData.max_players}
						onChange={(e) =>
							setFormData({
								...formData,
								max_players: parseInt(e.target.value),
							})
						}
					/>
				</label>
				<div className="flex justify-end gap-2">
					<button onClick={onClose} className="px-4 py-2 text-gray-400">
						Cancelar
					</button>
					<button
						onClick={handleCreateRoom}
						className="px-4 py-2 bg-blue-600 text-white rounded font-bold"
					>
						Crear
					</button>
				</div>
			</div>
		</div>
	);
}
