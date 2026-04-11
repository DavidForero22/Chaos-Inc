// src/pages/MainMenuPage.tsx

export default function MainMenuPage() {
	return (
		<div style={{ paddingLeft: "1rem" }}>
			{/* Título principal */}
			<h1
				style={{
					fontFamily: "'Courier New', Courier, monospace",
					fontSize: "2.5rem",
					fontWeight: 900,
					color: "#393e42",
					marginTop: 0,
					marginBottom: "0.25rem",
					lineHeight: "32px",
					paddingTop: "32px",
				}}
			>
				CHAOS INC.
			</h1>

			<h2
				style={{
					fontFamily: "'Courier New', Courier, monospace",
					fontSize: "1rem",
					fontWeight: 400,
					color: "#393e42",
					opacity: 0.65,
					marginTop: 0,
					marginBottom: "2rem",
					paddingBottom: "0.5rem",
					borderBottom: "1px solid rgba(146,158,156,0.5)",
					lineHeight: "32px",
				}}
			>
				Manual de Orientación General
			</h2>

			{/* Imagen de portada */}
			<div
				style={{
					width: "100%",
					aspectRatio: "21/9",
					background: "rgba(57,62,66,0.06)",
					border: "1.5px dashed rgba(57,62,66,0.2)",
					borderRadius: "4px",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					marginBottom: "2rem",
				}}
			>
				<span
					style={{
						fontFamily: "'Courier New', Courier, monospace",
						fontSize: "0.8rem",
						color: "rgba(57,62,66,0.4)",
						fontStyle: "italic",
					}}
				>
					[ Espacio para Imagen de Portada ]
				</span>
			</div>

			{/* Cuerpo del manual */}
			<div
				style={{
					fontFamily: "'Courier New', Courier, monospace",
					fontSize: "0.95rem",
					color: "#393e42",
					lineHeight: "32px",
					display: "flex",
					flexDirection: "column",
					gap: "0",
				}}
			>
				<p style={{ margin: 0, paddingLeft: "1rem" }}>
					Bienvenido a Chaos Inc. Si está leyendo esta libreta, significa que ha
					sobrevivido a la fase 1 del proceso de selección o que, por el
					contrario, ha robado material de oficina confidencial.
				</p>

				<p style={{ margin: 0, paddingLeft: "1rem" }}>
					El objetivo principal de esta compañía no es la eficiencia productiva,
					sino la gestión controlada de las dinámicas de poder en la oficina. Su
					papel, ya sea como Jefe, Secretario, Becario o miembro del Sindicato,
					requerirá astucia, cartas de acción y una tolerancia por encima de la
					media al estrés laboral.
				</p>

				<p style={{ margin: 0, paddingLeft: "1rem" }}>
					Las salas de reuniones (pestaña azul) son el campo de batalla. En
					ellas, se le asignará un rol oculto. No confíe en nadie. El Becario
					podría estar planeando una revolución y el Sindicato podría estar
					negociando a sus espaldas.
				</p>

				{/* Líneas vacías decorativas (mantienen el ritmo de la pauta) */}
				<p style={{ margin: 0, height: "128px" }} />

				<p
					style={{
						margin: 0,
						textAlign: "center",
						opacity: 0.4,
						fontStyle: "italic",
					}}
				>
					[Página intencionadamente dejada en blanco por el comité de censura
					corporativa]
				</p>

				<p style={{ margin: 0, height: "96px" }} />

				<p style={{ margin: 0, paddingLeft: "1rem" }}>
					Si su nivel de estrés alcanza niveles críticos, por favor diríjase al
					departamento de Recursos Humanos. Probablemente no le ayudarán, pero
					existe un formulario (Anexo C-4) para solicitar una carta de curación
					que será procesada en 3-5 días hábiles.
				</p>

				<p style={{ margin: 0, paddingLeft: "1rem" }}>
					Recuerde: Sobrevivir a la ronda es ganar. Buena suerte.
				</p>
			</div>
		</div>
	);
}
