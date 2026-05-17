// src/pages/MainMenuPage.tsx
// Accesibilidad comprobada: SI

export default function MainMenuPage() {
	return (
		<div className="pl-6 pb-10">
			{/* Título principal */}
			<h1
				className="text-4xl mb-6 font-black"
				style={{ color: "var(--color-lomo)" }}
			>
				CHAOS INC.
			</h1>

			<h2 className="text-xl mb-8 opacity-80 border-b border-gray-400 pb-2 font-bold">
				Manual de Orientación General
			</h2>

			{/* Imagen de portada */}
			<div
				className="w-full mb-8 flex items-center justify-center rounded border-2 border-dashed border-gray-400/40 bg-gray-400/10"
				style={{ aspectRatio: "21/9" }}
			>
				<span className="text-sm italic opacity-50">
					[ Espacio para Imagen de Portada ]
				</span>
			</div>

			{/* Cuerpo del manual */}
			<div className="space-y-6">
				<p>
					Bienvenido a Chaos Inc. Si está leyendo esta libreta, significa que ha
					sobrevivido a la fase 1 del proceso de selección o que, por el
					contrario, ha robado material de oficina confidencial.
				</p>

				<p>
					El objetivo principal de esta compañía no es la eficiencia productiva,
					sino la gestión controlada de las dinámicas de poder en la oficina. Su
					papel, ya sea como Jefe, Secretario, Becaria o miembro del Sindicato,
					requerirá astucia, cartas de acción y una tolerancia por encima de la
					media al estrés laboral.
				</p>

				<p>
					Las salas de reuniones (pestaña azul) son el campo de batalla. En
					ellas, se le asignará un rol oculto. No confíe en nadie. El Becaria
					podría estar planeando una revolución y el Sindicato podría estar
					negociando a sus espaldas.
				</p>

				{/* Saltos de línea para mantener el ritmo de los renglones de la libreta */}
				<br />
				<br />
				<br />
				<br />

				<p className="text-center opacity-50 italic">
					[Página intencionadamente dejada en blanco por el comité de censura
					corporativa]
				</p>

				<br />
				<br />
				<br />

				<p>
					Si su nivel de estrés alcanza niveles críticos, por favor diríjase al
					departamento de Recursos Humanos. Probablemente no le ayudarán, pero
					existe un formulario (Anexo C-4) para solicitar una carta de curación
					que será procesada en 3-5 días hábiles.
				</p>

				<p>Recuerde: Sobrevivir a la ronda es ganar. Buena suerte.</p>
			</div>
		</div>
	);
}
