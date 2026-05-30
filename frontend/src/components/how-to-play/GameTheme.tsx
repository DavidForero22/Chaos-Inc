// src/components/how-to-play/GameTheme.tsx

export default function GameTheme() {
	return (
		<section aria-labelledby="theme-title">
			<h3 id="theme-title" className="text-2xl font-bold mb-4 text-gray-800">
				1. Descripción
			</h3>
			<div className="space-y-3 text-gray-700 leading-relaxed">
				<p>
					<strong>Chaos Inc.</strong> es un juego de suerte, astucia y
					habilidad.
				</p>

				<p>
					Todos los jugadores tendrán un rol que no podrán revelar al resto de
					compañeros, a excepción del <strong>Jefe</strong>, el cual será el
					único rol visible. Cada rol tiene un objetivo distinto para ganar la
					partida.
				</p>

				<p>
					Tendrás que aumentar el estrés a tus oponentes (atacándoles) para
					derrotarles. Si su nivel de estrés llega al límite, sufrirán un{" "}
					<em>Burnout</em> y serán eliminados. Los jugadores tendrán a mano
					diferentes acciones para sobrevivir al caos.
				</p>
			</div>
		</section>
	);
}
