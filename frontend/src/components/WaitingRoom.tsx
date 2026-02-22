import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
// import api from "../api/axios";

export default function WaitingRoom() {
	const { id } = useParams(); // Saca el ID de la sala desde la URL (/room/AB12CD)
	const navigate = useNavigate();
	const { user } = useAuthStore();

	const handleLeaveRoom = async () => {
		try {
			// Aquí notificarías al backend que te vas: await api.post(`/rooms/${id}/leave`);
			navigate("/"); // Te devuelve al menú principal
		} catch (error) {
			console.error("Error al salir");
		}
	};

	return (
		<div className="max-w-2xl mx-auto mt-12 bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700 text-center">
			<h1 className="text-3xl font-bold text-white mb-2">Sala de Espera</h1>
			<p className="text-gray-400 font-mono text-xl mb-8">
				Código: <span className="text-yellow-400">{id}</span>
			</p>

			<div className="bg-gray-900 p-6 rounded-lg mb-8 text-left">
				<h3 className="text-lg font-bold text-blue-400 mb-4 border-b border-gray-700 pb-2">
					Jugadores Conectados
				</h3>
				<ul className="space-y-2">
					<li className="flex items-center gap-2 text-white">
						<span className="w-2 h-2 rounded-full bg-green-500"></span>
						{user ? user : "Tú (Anónimo)"}{" "}
						<span className="text-xs text-gray-500">(Preparado)</span>
					</li>
					<li className="flex items-center gap-2 text-gray-400 italic">
						<span className="w-2 h-2 rounded-full bg-gray-600"></span>
						Esperando a más jugadores...
					</li>
				</ul>
			</div>

			<div className="flex justify-center gap-4">
				<button
					onClick={handleLeaveRoom}
					className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded font-bold transition"
				>
					Abandonar Sala
				</button>
				<button
					disabled
					className="px-6 py-3 bg-gray-600 text-gray-400 rounded font-bold cursor-not-allowed"
				>
					Empezar Partida (Faltan jugadores)
				</button>
			</div>
		</div>
	);
}
