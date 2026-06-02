// src/components/how-to-play/CoreMechanics.tsx

export default function CoreMechanics() {
	return (
		<section aria-labelledby="mechanics-title">
			<h3
				id="mechanics-title"
				className="text-2xl font-bold mb-4 text-gray-800"
			>
				3. Mecánicas Principales
			</h3>

			<div className="space-y-6 text-gray-700">
				<div>
					<h4 className="font-bold text-lg text-gray-900 mb-2">A. Estrés</h4>
					<p>
						En lugar de puntos de vida tradicionales, los jugadores cuentan con
						una barra de <strong>Estrés</strong>. Si el nivel alcanza el límite
						máximo permitido, el empleado sufrirá un <em>Burnout</em> (baja por
						estrés), eliminándose inmediatamente de la partida.{" "}
					</p>
					<p>
						Todos los jugadores tienen un máximo de{" "}
						<strong>4 puntos de estrés</strong>, a excepción del jefe que puede
						tener hasta <strong>5 puntos de estrés</strong>
					</p>
					<div className="flex justify-center flex-col text-center my-10">
						<img
							src="/mixed/stress-guide.png"
							alt="Dibujo conceptual de la barra de estrés"
						/>
						<p className="text-sm mt-4 italic">Dibujo conceptual del estrés</p>

						<div className="flex justify-center">
							<img
								src="/mixed/stress-example.png"
								className="w-90 mt-8"
								alt="Ejemplo de indicador de estrés en la interfaz"
							/>
						</div>
						<p className="text-sm mt-4 italic">
							Indicador de estrés en la interfaz de la partida
						</p>
					</div>
					<p className="mb-4">
						A más estrés, menos cartas podrás conservar en tu mano al terminar
						el turno. Si tu número de cartas{" "}
						<strong>excede el límite de tu mano</strong>, deberás descartar
						cartas hasta estar por debajo del límite.
					</p>{" "}
					<div className="flex justify-center flex-col text-center my-10">
						<div className="flex justify-center">
							<img
								src="/mixed/stress-low-example.png"
								className="w-110"
								alt="Ejemplo de límite de cartas con estrés bajo (6 cartas)"
							/>
						</div>
						<p className="text-sm mt-4 italic">
							Límite de cartas teniendo un estrés bajo (6)
						</p>

						<div className="flex justify-center">
							<img
								src="/mixed/stress-high-example.png"
								className="w-110 mt-8"
								alt="Ejemplo de límite de cartas con estrés alto (2 cartas, excede el límite)"
							/>
						</div>
						<p className="text-sm mt-4 italic">
							Límite de cartas teniendo un estrés alto (2, el jugador excede el
							límite)
						</p>
					</div>
				</div>
				<div>
					<h4 className="font-bold text-lg text-gray-900 mb-2">B. Alcance</h4>
					<p>
						No todos los empleados pueden atacarse directamente. El{" "}
						<strong>Alcance</strong> define a cuántos puestos de distancia
						puedes enviar un "Ataque".
					</p>
					<ul className="list-disc pl-6 mt-2 space-y-1">
						<li>
							Los jugadores sentados a tu lado (adyacentes) están a{" "}
							<strong>distancia 1</strong>.
						</li>
						<li>
							Existen cartas pasivas que pueden ampliar tu rango de ataque o
							alejarte de tus compañeros para evitar ser atacado.
						</li>
						<li>
							Al eliminar a un jugador, no se le tendrá en cuenta para calcular
							la distancia.
						</li>
					</ul>

					<div className="flex justify-center flex-col text-center my-10">
						<img
							src="/mixed/distance-guide.png"
							alt="Dibujo conceptual de la distancia entre jugadores"
						/>
						<p className="text-sm mt-4 italic">
							Dibujo conceptual de distancia de jugadores
						</p>
						<div className="flex justify-center mt-8">
							<img
								src="/mixed/distance-example.png"
								className="w-140"
								alt="Interfaz mostrando la distancia a un jugador indicada en su carta"
							/>
						</div>
						<p className="text-sm mt-4 italic">
							En la interfaz del juego, la distancia a la que está un jugador de
							ti se indica en la carta del oponente.
						</p>
						<div className="flex justify-center mt-8">
							<img
								src="/mixed/distance-invalid-example.gif"
								className="w-100"
								alt="Jugadores fuera de alcance deshabilitados al seleccionar una carta de ataque"
							/>
						</div>
						<p className="text-sm mt-4 italic">
							Al elegir una carta de ataque, los jugadores fuera de tu alcance
							se deshabilitarán.
						</p>
					</div>
				</div>
				<div>
					<h4 className="font-bold text-lg text-gray-900 mb-4">C. Cartas</h4>
					<p>
						Los jugadores contarán con diferentes cartas para atacar, defenderse
						y planear sus estrategias. Se pueden clasificar las cartas en 4
						tipos:
					</p>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
						{[
							{
								type: "Ataques",
								color: "bg-red-50",
								border: "border-red-500",
								text: "Aumentan el estrés a los oponentes.",
							},
							{
								type: "Salud",
								color: "bg-green-50",
								border: "border-green-500",
								text: "Reducen tu cantidad de estrés.",
							},
							{
								type: "Pasivas",
								color: "bg-yellow-50",
								border: "border-yellow-400",
								text: "Efectos constantes. Máximo 3 equipadas. Los oponentes te las pueden quitar con la carta 'Recorte'",
							},
							{
								type: "Utilidad",
								color: "bg-gray-100",
								border: "border-gray-500",
								text: "Robar cartas, esquivar ataques, bloquear turnos enemigos...",
							},
						].map((card) => (
							<div
								key={card.type}
								className={`p-4 rounded-lg border-l-4 ${card.color} ${card.border}`}
							>
								<strong className="block text-gray-900">{card.type}</strong>
								<p className="text-sm text-gray-700">{card.text}</p>
							</div>
						))}
					</div>
				</div>
				{/* Cartas Caóticas */}
				<div className="bg-purple-50 p-6 rounded-xl border border-purple-200">
					<h4 className="font-bold text-lg text-purple-900 mb-2">
						Cartas Caóticas
					</h4>
					<p className="text-purple-800">
						Son cartas extremadamente poderosas y raras. Debido a su poder,{" "}
						<strong>exigen sacrificar otra carta de tu mano</strong> para poder
						activarlas. ¡Úsalas con cabeza!
					</p>
				</div>{" "}
				<p>
					El borde de las cartas representa su tipo y los iconos de la parte
					inferior indican el efecto de la carta. Hay una guía de iconos dentro
					de las partidas para facilitar la lectura de estos.
				</p>
				<div className="flex justify-center my-10">
					<img
						src="/mixed/cards_example.png"
						alt="Ejemplos de cartas con diferentes bordes e iconos"
					/>
				</div>
			</div>
		</section>
	);
}
