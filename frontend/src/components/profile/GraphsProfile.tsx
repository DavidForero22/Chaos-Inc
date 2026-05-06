// src/components/profile/GraphsProfile.tsx

import { useState, useMemo } from "react";
import type { GameRecord } from "../../types/api";
import styles from "./GraphsProfile.module.css";
import viewStyles from "./RegisteredProfileView.module.css";

interface GraphsProfileProps {
	games: GameRecord[];
	user: string | null | undefined;
}

export default function GraphsProfile({ games, user }: GraphsProfileProps) {
	const [isExpanded, setIsExpanded] = useState(false);

	const stats = useMemo(() => {
		if (!user) {
			return { wins: 0, damage: 0, received: 0, cards: 0, eliminations: 0 };
		}

		return games.reduce(
			(acc, game) => {
				const me = game.players.find((p) => p.displayName === user);
				if (!me) return acc;
				return {
					wins: acc.wins + (me.stats.hasWon ? 1 : 0),
					damage: acc.damage + me.stats.damageDealt,
					received: acc.received + me.stats.damageReceived,
					cards: acc.cards + me.stats.cardsPlayed,
					eliminations: acc.eliminations + me.stats.eliminations,
				};
			},
			{ wins: 0, damage: 0, received: 0, cards: 0, eliminations: 0 },
		);
	}, [games, user]);

	return (
		<div className={viewStyles.section}>
			{/* ── ESTADÍSTICAS BÁSICAS (Siempre Visibles) ── */}
			<div className={styles.statsGrid}>
				<div className={styles.statRow}>
					<span className={styles.statLabel}>PARTIDAS EVALUADAS:</span>
					<span className={styles.statValue}>{games.length}</span>
				</div>
				<div className={styles.statRow}>
					<span className={styles.statLabel}>VICTORIAS REGISTRADAS:</span>
					<span className={`${styles.statValue} ${styles.statValueHighlight}`}>
						{stats.wins}
					</span>
				</div>
				<div className={styles.statRow}>
					<span className={styles.statLabel}>ÍNDICE DE DERROTAS:</span>
					<span className={styles.statValue}>{games.length - stats.wins}</span>
				</div>
				<div className={styles.statRow}>
					<span className={styles.statLabel}>SUJETOS ELIMINADOS:</span>
					<span className={styles.statValue}>{stats.eliminations}</span>
				</div>
				<div className={styles.statRow}>
					<span className={styles.statLabel}>DAÑO INFLIGIDO (TOTAL):</span>
					<span className={styles.statValue}>{stats.damage}</span>
				</div>
				<div className={styles.statRow}>
					<span className={styles.statLabel}>DAÑO RECIBIDO (TOTAL):</span>
					<span className={styles.statValue}>{stats.received}</span>
				</div>
				<div className={styles.statRow}>
					<span className={styles.statLabel}>PRODUCTIVIDAD (CARTAS):</span>
					<span className={styles.statValue}>{stats.cards}</span>
				</div>
			</div>

			{/* ── BOTÓN PARA DESPLEGAR ── */}
			<button
				className={styles.expandBtn}
				onClick={() => setIsExpanded(!isExpanded)}
			>
				{isExpanded
					? "[-] CERRAR EXPEDIENTE VISUAL"
					: "[+] ABRIR EXPEDIENTE VISUAL (ECHARTS)"}
			</button>

			{/* ── CONTENEDOR EXPANDIBLE (Futuro ECharts) ── */}
			<div
				className={`${styles.expandableWrapper} ${isExpanded ? styles.open : ""}`}
			>
				<div className={styles.expandedContentInner}>
					<div className={styles.expandedContent}>
						<div className={styles.classifiedStamp}>CLASIFICADO</div>
						<p className={styles.placeholderTitle}>
							EXPEDIENTE VISUAL DE RENDIMIENTO
						</p>
						<p className={styles.placeholderDesc}>
							[ ESPACIO RESERVADO PARA LA INSERCIÓN DE GRÁFICOS DEL DEPARTAMENTO
							DE ANÁLISIS ECHARTS ]
						</p>

						<div className={styles.placeholderGraphs}>
							<div className={styles.graphBox}>RADAR DE PERFIL</div>
							<div className={styles.graphBox}>HISTÓRICO DE PRODUCTIVIDAD</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
