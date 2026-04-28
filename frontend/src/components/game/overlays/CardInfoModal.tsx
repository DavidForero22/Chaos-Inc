// src/components/game/overlays/CardInfoModal.tsx
import { useState } from "react";
import type { CardInstance } from "../../../types/live-game.ts";
import { createPortal } from "react-dom";
import styles from "./CardInfoModal.module.css";

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
					{/* Título de la Variante y Tipo Base */}
					<div>
						<h2 className={styles.title}>{card.name}</h2>
						<span className="text-xs uppercase font-bold text-gray-400 tracking-wider">
							[{card.base_name}]
						</span>
					</div>

					<div className="mt-4">
						<div className={styles.sectionLabel}>EFECTO</div>
						<p className={styles.typewriterText}>{card.description}</p>
					</div>

					<div className="mt-6">
						<div
							className={styles.sectionLabel}
							style={{ transform: "rotate(1deg)" }}
						>
							NOTA
						</div>
						<p className={`${styles.typewriterText} text-gray-500 italic`}>
							{card.lore ?? "Una carta misteriosa con poderes desconocidos."}
						</p>
					</div>
				</div>
			</div>
		</div>,
		document.body,
	);
}
