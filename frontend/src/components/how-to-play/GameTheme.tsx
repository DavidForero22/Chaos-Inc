// src/components/how-to-play/GameTheme.tsx

export default function GameTheme() {
	return (
		<section aria-labelledby="theme-title">
			<h3 id="theme-title" className="text-2xl font-bold mb-4 text-gray-800">
				1. Descripción
			</h3>
			<div className="space-y-3 text-gray-700 leading-relaxed">
				<p>
					<strong>Chaos Inc.</strong> es un juego de cartas de engaño, astucia y
					supervivencia en una empresa corrupta con el mismo nombre del juego.
				</p>
				<p>
					A excepción del <strong>Jefe</strong>, cuyo rol es público, el resto
					de jugadores mantendrán su rol en secreto. Tu meta será usar los
					recursos disponibles para derrotar a tus rivales y cumplir con la
					condición de victoria de tu rol.
				</p>
			</div>
		</section>
	);
}
