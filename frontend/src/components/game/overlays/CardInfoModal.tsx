// src/components/game/overlays/CardInfoModal.tsx
import { useState } from "react";
import type { CardInstance } from "../../../types/live-game.ts";
import { createPortal } from "react-dom";
import styles from "./CardInfoModal.module.css";

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
	const [isExiting, setIsExiting] = useState(false);

	// En lugar de cerrar de golpe, activar la salida y esperamos 250ms
	const handleClose = () => {
		if (isExiting) return; // Evitar dobles clics
		setIsExiting(true);
		setTimeout(() => {
			onClose();
		}, 250); // Mismo tiempo que dura la animación CSS
	};

	return createPortal(
		<div
			className={`fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm ${
				isExiting ? styles.fadeOut : styles.overlay
			}`}
			onClick={handleClose}
		>
			{/* El Bloc de Notas que se desliza desde la derecha (o se retira hacia la derecha) */}
			<div
				className={`${styles.notepadContainer} ${
					isExiting ? styles.slideOutRight : styles.slideInRight
				}`}
				onClick={(e) => e.stopPropagation()}
			>
				{/* La encuadernación con el botón de cerrar */}
				<div className={styles.binding}>
					<button
						onClick={handleClose}
						className="text-gray-400 hover:text-white transition text-2xl font-black leading-none"
						title="Cerrar notas"
					>
						✕
					</button>
				</div>

				{/* El papel con líneas y el contenido */}
				<div className={styles.paper}>
					<h2 className={styles.title}>{card.name}</h2>

					<div className={styles.sectionLabel}>EFECTO</div>
					<p className={styles.typewriterText}>{card.description}</p>

					<div
						className={styles.sectionLabel}
						style={{ transform: "rotate(1deg)" }}
					>
						NOTA
					</div>
					<p className={`${styles.typewriterText} text-gray-500 `}>
						{CARD_LORE[card.type] ??
							"Una carta misteriosa con poderes desconocidos."}
					</p>
				</div>
			</div>
		</div>,
		document.body,
	);
}
