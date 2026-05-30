// src/components/how-to-play/TurnFlow.tsx

export default function TurnFlow() {
	return (
		<section aria-labelledby="flow-title">
			<h3 id="flow-title" className="text-2xl font-bold mb-4 text-gray-800">
				4. Flujo de Turnos
			</h3>
			<p className="mb-4 text-gray-700">
				Cada turno de jugador se divide en tres fases. Los turnos tienen un tiempo limite, no puedes quedarte decidiendo por mucho tiempo.
			</p>

			<ol className="list-decimal pl-6 space-y-4 text-gray-700 marker:font-bold marker:text-gray-900">
				<li>
					<strong>Reparto de cartas:</strong>
					<br />
					El jugador roba automáticamente <strong>dos cartas</strong> del mazo
					central al comenzar su turno.
				</li>
				<li>
					<strong>Fase de Acción:</strong>
					<br />
					El jugador juega las cartas de su mano. Hay algunas limitaciones, como <strong>solo poder lanzar un ataque por turno</strong>.
				</li>
				<li>
					<strong>Fase de Descarte:</strong>
					<br />
					Al finalizar, si tiene más cartas en la mano que su capacidad de
					estrés actual, <strong>deberá descartarse</strong> de
					las sobrantes hasta igualar dicho límite antes de ceder el turno al
					siguiente empleado.
				</li>
			</ol>
		</section>
	);
}
