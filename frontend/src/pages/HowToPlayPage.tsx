// src/pages/HowToPlayPage.tsx

export default function HowToPlayPage() {
	return (
		<div className="pl-6 space-y-6 pb-10">
			<h1
				className="text-4xl mb-6 font-black"
				style={{ color: "var(--color-lomo)" }}
			>
				CÓMO JUGAR
			</h1>
			<h2 className="text-xl mb-8 opacity-80 border-b border-gray-400 pb-2 font-bold">
				Directiva Operativa: Sobrevivir al Caos
			</h2>

			<div className="space-y-4">
				<p>
					Su ingreso en las salas de reuniones de <strong>Chaos Inc.</strong>{" "}
					implica la aceptación táctica de que cualquier daño psicológico
					sufrido durante su jornada laboral no será cubierto por la mutua.
				</p>

				<h3 className="text-lg font-bold mt-6">Reglamento Básico:</h3>
				<ul className="list-disc pl-6 space-y-3">
					<li>
						<strong>Identidades Ocultas:</strong> Al inicio de la jornada, se le
						asignará un rol. No revele su posición. Si el Sindicato descubre que
						usted es el Jefe, su despido (o eliminación) será inminente.
					</li>
					<li>
						<strong>Sistema de Turnos:</strong> Durante su turno, podrá jugar
						una carta de acción, pasar o acusar a un compañero de bajo
						rendimiento.
					</li>
					<li>
						<strong>Cartas de Acción:</strong> Utilice los recursos de la
						oficina sabiamente. Puede robar informes, desviar la culpa o
						sabotear el café del becario.
					</li>
					<li>
						<strong>Condición de Victoria:</strong> El último empleado que
						conserve su cordura (puntos de vida) se considerará el Empleado del
						Mes. Si el becario abandona la sala, el Sindicato gana
						automáticamente.
					</li>
				</ul>

				<br />
				<p className="italic opacity-70 text-sm border-l-2 border-red-400 pl-4">
					Nota: Las reglas están sujetas a cambios sin previo aviso por parte de
					la Dirección. Quejarse constituye una infracción grave.
				</p>
			</div>
		</div>
	);
}
