import { Link } from "react-router-dom";

export default function RoomNotFoundPage() {
	return (
		<div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4 text-center">
			<h1 className="text-6xl font-black text-red-500 mb-4">404</h1>
			<h2 className="text-3xl font-bold mb-2">Partida no encontrada</h2>
			<p className="text-gray-400 mb-8 max-w-md">
				La sala a la que intentas acceder ya no existe, la partida ha terminado
				o el enlace es incorrecto.
			</p>
			<Link
				to="/"
				className="px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded font-bold transition shadow-lg shadow-purple-900/50"
			>
				Volver
			</Link>
		</div>
	);
}
