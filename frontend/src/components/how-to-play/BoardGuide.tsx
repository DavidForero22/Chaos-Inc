// src/components/how-to-play/BoardGuide.tsx

export default function BoardLayout() {
	return (
		<section aria-labelledby="board-title">
			<h3 id="board-title" className="text-2xl font-bold mb-4 text-gray-800">
				5. El Tablero de Juego
			</h3>
			<p className="mb-6 text-gray-700">
				Todo buen empleado debe conocer su puesto de trabajo. Durante la
				partida, esta será tu interfaz:
			</p>

			<h4 className="font-bold mt-7 mb-3"> A. Jugadores</h4>
			<div className="mb-8 flex justify-center">
				<img
					src="/guide/ui-players.png"
					alt="Jugadores en el tablero mostrando distancia, cartas en mano, estrés, pasivas, jefe y turno actual"
					className="w-100 h-auto object-cover"
					loading="lazy"
				/>
			</div>

			<p className="text-gray-700 pt-1">
				El resto de jugadores de la partida. Aquí puedes ver la distancia a la
				que están, las cartas que tienen en mano, su cantidad de estrés actual,
				sus pasivas equipadas, quién es el Jefe y de quién es el turno actual
				(el temporizador amarillo).
			</p>

			<h4 className="font-bold mt-7 mb-3"> B. Información Personal</h4>
			<div className="mb-8 flex justify-center">
				<img
					src="/guide/ui-stats.png"
					alt="Información personal del jugador: rol, estrés, alcance, pasivas y efectos de estado"
					className="w-70 h-auto object-cover"
					loading="lazy"
				/>
			</div>

			<p className="text-gray-700 pt-1">
				Se muestra tu información. Cuál es tu rol (si aplica), tu cantidad de
				estrés, el alcance que tienes para atacar, las pasivas que tienes
				equipadas y los efectos de estado que te afecten.
			</p>

			<h4 className="font-bold mt-7 mb-3"> C. Tu Mano</h4>
			<div className="mb-8 flex justify-center">
				<img
					src="/guide/ui-player-hand.png"
					alt="Mano del jugador con cartas y botones de Inspeccionar, Descartar y Terminar Turno"
					className="w-160 h-auto object-cover"
					loading="lazy"
				/>
			</div>

			<p className="text-gray-700 pt-1">
				Tus cartas disponibles. Encima tienes los botones para{" "}
				<strong>Inspeccionar</strong> (ver más información de las cartas y la
				guía de iconos), <strong>Descartar</strong> cartas (en la fase de
				descarte) y <strong>Terminar Turno</strong>.
			</p>

			<h4 className="font-bold mt-7 mb-3"> D. Menú</h4>
			<div className="mb-8 flex justify-center">
				<img
					src="/guide/ui-buttons.png"
					alt="Botones de menú: salir, chat/historial y guía de iconos"
					className="w-60 h-auto object-cover"
					loading="lazy"
				/>
			</div>

			<p className="text-gray-700 pt-1">
				Botones para salir de la partida, abrir el chat/historial de acciones y
				consultar la guía de iconos.
			</p>

			<h4 className="font-bold mt-7 mb-3"> E. Estado de la sala</h4>
			<div className="mb-8 flex justify-center">
				<img
					src="/guide/ui-room-status.png"
					alt="Estado de la sala: cartas restantes en mazo, ID de sala y número de ronda"
					className="w-50 h-auto object-cover"
					loading="lazy"
				/>
			</div>

			<p className="text-gray-700 pt-1">
				Información general de la partida. Muestra las cartas restantes en el
				mazo global, el ID de la sala y el número de la ronda actual.
			</p>
		</section>
	);
}
