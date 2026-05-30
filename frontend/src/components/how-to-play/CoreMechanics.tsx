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
						una barra de <strong>Estrés</strong> (iniciando en 0). Si su nivel
						de estrés alcanza el límite máximo permitido, sufrirá un{" "}
						<em>Burnout</em>, solicitando una baja por estrés de la empresa y
						eliminandose inmediatamente de la partida.
					</p>
					<div className="flex justify-center my-10">
						<img src="/mixed/stress-guide.png" />
					</div>
					<p className="mb-4">
						A más estrés, menos cartas podrás conservar en tu mano al terminar
						el turno.
					</p>{" "}
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

					<div className="flex justify-center my-10">
						<img src="/mixed/range-guide.png" />
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
								text: "Aumentan el estrés a los oponentes de forma inmediata.",
							},
							{
								type: "Salud",
								color: "bg-green-50",
								border: "border-green-500",
								text: "Cartas esenciales para reducir tu estrés y evitar el Burnout.",
							},
							{
								type: "Pasivas",
								color: "bg-yellow-50",
								border: "border-yellow-400",
								text: "Efectos constantes. Máximo 3 equipadas. ¡Cuidado con el 'Recorte'!",
							},
							{
								type: "Utilidad",
								color: "bg-gray-100",
								border: "border-gray-500",
								text: "Robar cartas, esquivar ataques o bloquear turnos enemigos.",
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
					El borde de las cartas representará su tipo y los iconos de la parte
					inferior indican de forma resumida el efecto de la carta. Hay una guía de iconos dentro de las partidas para facilitar la lectura de estos.
				</p>
				<div className="flex justify-center my-10">
					<img src="/mixed/cards_example.png" />
				</div>
			</div>
		</section>
	);
}
