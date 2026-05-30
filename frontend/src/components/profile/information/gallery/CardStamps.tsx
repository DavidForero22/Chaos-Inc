// src/components/gallery/CardStamps.tsx

import styles from "./CardStamps.module.css";
import type { EnrichedCard } from "../../../../types/gallery";

interface CardStampsProps {
	card: EnrichedCard;
}

// Diccionarios de traducción
const TYPE_LABELS: Record<string, string> = {
	attack: "ATAQUE",
	heal: "CURACIÓN",
	perk: "PASIVA",
	default: "UTILIDAD",
};

const TARGET_LABELS: Record<string, string> = {
	self: "UNO MISMO",
	opponent: "UN RIVAL",
	opponents: "MÚLTIPLES RIVALES",
	all: "TODOS",
	none: "SIN OBJETIVO",
};

export function CardStamps({ card }: CardStampsProps) {
	// Si la carta no está descubierta, no mostramos información clasificada
	if (!card.is_discovered) return null;

	const typeLabel = card.type
		? TYPE_LABELS[card.type] || card.type
		: "DESCONOCIDO";
	const targetLabel = card.target
		? TARGET_LABELS[card.target] || card.target
		: "DESCONOCIDO";
	const isChaotic = card.category === "chaotic";

	return (
		<div className={styles.stampsContainer}>
			{/* SELLO DE CATEGORÍA*/}
			{isChaotic && (
				<span className={`${styles.stamp} ${styles.stampChaotic}`}>
					CAÓTICA
				</span>
			)}

			{/* SELLO DE TIPO */}
			<span
				className={`${styles.stamp} ${
					card.type === "attack"
						? styles.stampAttack
						: card.type === "heal"
							? styles.stampHeal
							: card.type === "perk"
								? styles.stampPerk
								: styles.stampDefault
				}`}
			>
				{typeLabel}
			</span>

			{/* SELLO DE OBJETIVO */}
			<span className={`${styles.stamp} ${styles.stampTarget}`}>
				{targetLabel}
			</span>
		</div>
	);
}
