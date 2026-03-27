import type { CardInstance } from "../../../types/live-game.ts";
import { createPortal } from "react-dom";

const CARD_LORE: Record<number, string> = {
	1: "En toda oficina hay tensión acumulada. A veces, un empujón bien dado puede ser la gota que colme el vaso de tu rival.",
	2: "Respira hondo, tómate un café y recuerda que esto es solo un trabajo. El estrés baja cuando te lo propones.",
	3: "Llevas años esquivando reuniones innecesarias. Esquivar un ataque directo no es tan diferente.",
	4: "La información es poder. Y las cartas de los demás, también.",
	5: "Pusiste un escudo en tu perfil de LinkedIn. Ahora tienes uno de verdad.",
	6: "Una auditoría inesperada puede paralizar a cualquiera. Tu rival tendrá que decidir bien su próximo movimiento.",
	7: "Todos a la sala de reuniones. Nadie sale hasta que esto termine.",
	8: "El médico de empresa ha pasado por aquí. Todos se sienten un poco mejor.",
	9: "Has movido algunos archivos de sitio. Tu rival no encontrará lo que busca cuando lo necesite.",
	10: "Nuevas gafas de empresa. Ahora ves más lejos en el tablero.",
	11: "Teletrabajo aprobado. Tu rival tendrá que viajar más para alcanzarte.",
	13: "Has conseguido un archivador extra. Puedes guardar más recursos.",
	14: "Hoy es tu día de suerte en la empresa.",
};

interface CardInfoModalProps {
	card: CardInstance;
	onClose: () => void;
}

export function CardInfoModal({ card, onClose }: CardInfoModalProps) {
	return createPortal (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
			onClick={onClose}
		>
			<div
				className="bg-gray-800 border border-gray-600 rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="flex justify-between items-start mb-4">
					<h2 className="text-xl font-black text-white">{card.name}</h2>
					<button
						onClick={onClose}
						className="text-gray-500 hover:text-white transition text-lg font-bold leading-none ml-4"
					>
						✕
					</button>
				</div>

				<div className="bg-gray-900 rounded-lg p-3 border border-gray-700 mb-4">
					<p className="text-xs text-gray-500 uppercase font-bold mb-1">
						Efecto
					</p>
					<p className="text-gray-300 text-sm">{card.description}</p>
				</div>

				<div className="bg-gray-900 rounded-lg p-3 border border-gray-700">
					<p className="text-xs text-gray-500 uppercase font-bold mb-1">
						Contexto
					</p>
					<p className="text-gray-400 text-sm italic leading-relaxed">
						{CARD_LORE[card.type] ??
							"Una carta misteriosa con poderes desconocidos."}
					</p>
				</div>
			</div>
		</div>,
		document.body
	);
}
