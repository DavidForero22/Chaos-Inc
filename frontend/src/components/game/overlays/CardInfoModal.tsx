// src/components/game/overlays/CardInfoModal.tsx
import { useState } from "react";
import type { CardInstance } from "../../../types/live-game.ts";
import { createPortal } from "react-dom";
import styles from "./CardInfoModal.module.css";

// Mapa de traducción para los tipos de carta
const TYPE_MAP: Record<string, string> = {
	attack: "Ataque",
	heal: "Curación",
	perk: "Pasiva",
	default: "General",
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

	// Obtenemos la traducción del tipo, o mostramos el valor original si no existe en el mapa
	const translatedType = TYPE_MAP[card.type] || card.type;

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
					{/* Título de la Variante y Tipo (Traducido) */}
					<div>
						<h2 className={styles.title}>{card.name}</h2>
						<span className="text-xs uppercase font-bold text-gray-500 tracking-wider bg-gray-200/50 px-2 py-1 rounded border border-gray-300">
							[{translatedType}]
						</span>
					</div>

					<div className="mt-6">
						<div className={styles.sectionLabel}>EFECTO</div>
						<p className={styles.typewriterText}>{card.description}</p>
					</div>

					<div className="mt-6">
						<div
							className={styles.sectionLabel}
						>
							NOTA
						</div>
						<p className={`${styles.typewriterText} text-gray-500 italic`}>
							{card.lore || "Una carta misteriosa con poderes desconocidos."}
						</p>
					</div>
				</div>
			</div>
		</div>,
		document.body,
	);
}
