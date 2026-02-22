import { useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";

export default function GameBoard() {
	const { id } = useParams();
	const location = useLocation();
	const navigate = useNavigate();

	// Recuperamos nuestro nombre de jugador (pasado por el navigate desde WaitingRoom)
	const myPlayerName = location.state?.playerName;

	useEffect(() => {
		// Si alguien intenta entrar a /game/123 por URL directa sin nombre, lo mandamos al menú
		if (!myPlayerName) {
			navigate("/");
			return;
		}

		// Aquí en el futuro haremos un fetch inicial para pedir NUESTRO rol y NUESTRAS cartas
		console.log(`Jugador ${myPlayerName} entrando a la partida en sala ${id}`);
	}, [id, myPlayerName, navigate]);

	if (!myPlayerName) return null;

	return (
		<div className="max-w-6xl mx-auto mt-8">
			<div className="bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700">
				<div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-700">
					<div>
						<h1 className="text-2xl font-bold text-white flex items-center gap-2">
							⚔️ Partida en Curso
							<span className="text-sm bg-red-900/50 text-red-400 px-2 py-0.5 rounded border border-red-700">
								Sala: {id}
							</span>
						</h1>
					</div>
					<div className="text-right">
						<p className="text-gray-400 text-sm">Jugando como</p>
						<p className="text-blue-400 font-bold">{myPlayerName}</p>
					</div>
				</div>

				<div className="py-20 text-center">
					<h2 className="text-xl text-gray-500 animate-pulse">
						Cargando el tablero de juego...
					</h2>
					<p className="text-gray-600 mt-2 text-sm">
						(Próximo paso: Pedir al backend tus cartas y tu rol)
					</p>
				</div>
			</div>
		</div>
	);
}
