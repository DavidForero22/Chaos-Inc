// src/components/how-to-play/BoardLayout.tsx

export default function BoardLayout() {
	return (
		<section aria-labelledby="board-title">
			<h3 id="board-title" className="text-2xl font-bold mb-4 text-gray-800">
				5. El Tablero de Juego
			</h3>
			<p className="mb-6 text-gray-700">
				Todo buen empleado debe conocer su puesto de trabajo. Durante la partida, esta será tu interfaz:
			</p>

			{/* Imagen del tablero */}
			<div className="mb-8 rounded-lg overflow-hidden border-2 border-gray-300 shadow-md">
				<img
					src="/mixed/board_example.png"
					alt="Ejemplo del tablero de la oficina"
					className="w-full h-auto object-cover"
				/>
			</div>

			{/* Leyenda numerada */}
			<div className="space-y-4">
				<div className="flex gap-4 items-start">
					<span className="shrink-0 w-8 h-8 bg-gray-800 text-white font-bold rounded-full flex items-center justify-center shadow-sm">
						1
					</span>
					<p className="text-gray-700 pt-1">
						<strong>Jugadores:</strong> El resto de jugadores de la
						partida. Aquí puedes ver la distancia a la que están, las cartas que
						tienen en mano, su cantidad de estrés actual, sus pasivas equipadas,
						quién es el Jefe y de quién es el turno actual (el temporizador
						amarillo).
					</p>
				</div>

				<div className="flex gap-4 items-start">
					<span className="shrink-0 w-8 h-8 bg-gray-800 text-white font-bold rounded-full flex items-center justify-center shadow-sm">
						2
					</span>
					<p className="text-gray-700 pt-1">
						<strong>Información personal:</strong> Se muestra tu información.
						Cuál es tu rol (si aplica), tu cantidad de estrés, el alcance que
						tienes para atacar, las pasivas que tienes equipadas y los efectos
						de estado que te afecten.
					</p>
				</div>

				<div className="flex gap-4 items-start">
					<span className="shrink-0 w-8 h-8 bg-gray-800 text-white font-bold rounded-full flex items-center justify-center shadow-sm">
						3
					</span>
					<p className="text-gray-700 pt-1">
						<strong>Tu Mano:</strong> Tus cartas disponibles. Encima tienes los
						botones para <strong>Inspeccionar</strong> (ver más información de
						las cartas y la guía de iconos), <strong>Descartar</strong> cartas
						(en la fase de descarte) y <strong>Terminar Turno</strong>.
					</p>
				</div>

				<div className="flex gap-4 items-start">
					<span className="shrink-0 w-8 h-8 bg-gray-800 text-white font-bold rounded-full flex items-center justify-center shadow-sm">
						4
					</span>
					<p className="text-gray-700 pt-1">
						<strong>Menú:</strong> Botones para salir de la partida,
						abrir el chat/historial de acciones y consultar la guía de iconos.
					</p>
				</div>

				<div className="flex gap-4 items-start">
					<span className="shrink-0 w-8 h-8 bg-gray-800 text-white font-bold rounded-full flex items-center justify-center shadow-sm">
						5
					</span>
					<p className="text-gray-700 pt-1">
						<strong>Estado de la sala:</strong> Información general de la
						partida. Muestra las cartas restantes en el mazo global, el ID de la
						sala y el número de la ronda actual.
					</p>
				</div>
			</div>
		</section>
	);
}
