// src/pages/MainMenuPage.tsx
// Accesibilidad comprobada: SI

import { NavLink } from "react-router-dom";

export default function MainMenuPage() {
	return (
		<main className="pl-6 pb-10">
			{/* Título principal */}
			<h1
				className="text-4xl mb-6 font-black"
				style={{ color: "var(--color-lomo)" }}
			>
				Inicio
			</h1>

			{/* Subtítulo semántico (cambiado para evitar redundancia con el h1) */}
			<h2 className="text-xl mb-8 opacity-80 border-b border-gray-400 pb-2 font-bold">
				Introducción
			</h2>

			{/* Cuerpo del manual */}
			<div className="space-y-6 text-gray-800 leading-relaxed">
				<p>
					Bienvenido a Chaos Inc. Si estás leyendo esta libreta, significa que
					perteneces al pequeño y selecto grupo de intelectuales que decidieron
					jugar a este juego. ¡Felicidades!
				</p>

				<p>
					Chaos Inc. es un juego de roles ocultos para 3 a 6 personas, con una
					duración de 15 a 30 minutos. Todos los jugadores tendrán un rol
					secreto y un objetivo que no podrán revelar, a excepción del Jefe. No
					te fíes de nadie; tus aliados pueden acabar siendo enemigos
					disfrazados.
				</p>

				<p>
					Si necesitas aprender a jugar para no ser brutalmente humillado por
					profesionales, puedes{" "}
					<NavLink
						to="/how-to-play"
						className="underline font-bold hover:opacity-70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 rounded-sm"
					>
						consultar el reglamento
					</NavLink>{" "}
					del juego.
				</p>

				<p>
					Si quieres crear o buscar partidas, accede al{" "}
					<NavLink
						to="/rooms"
						className="underline font-bold hover:opacity-70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 rounded-sm"
					>
						listado de salas
					</NavLink>
					.
				</p>

				<hr className="border-gray-300 my-8" />

				<p className="italic text-sm text-gray-600">
					Este juego ha sido creado por una única persona y se encuentra en
					desarrollo, por lo que podrían presentarse errores imprevistos.
					Agradecería que se me comunicasen estos fallos o cualquier sugerencia
					en lugar de maldecir a mis ancestros :).
				</p>
			</div>
		</main>
	);
}
