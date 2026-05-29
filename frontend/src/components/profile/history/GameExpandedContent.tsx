// src/components/profile/GameExpandedContent.tsx
import type { GameRecord, GameParticipant } from "../../../types/api";
import styles from "./GameExpandedContent.module.css";
import { PlayerRow } from "./PlayerRow";

interface GameExpandedContentProps {
	game: GameRecord;
	me: GameParticipant;
	isExpanded: boolean;
}

export function GameExpandedContent({
	game,
	me,
	isExpanded,
}: GameExpandedContentProps) {
	const gameDate = new Date(game.playedAt).toLocaleDateString("es-ES");

	return (
		<div
			className={`${styles.expandableWrapper} ${isExpanded ? styles.open : ""}`}
			role="region"
			aria-label={`Detalles de la partida del ${gameDate}`}
		>
			<div className={styles.expandedContentInner}>
				<div className={styles.expandedContent}>
					<h2 className={styles.expandedTitle}>
						REPORTE DE INCIDENCIA #{game.id}
					</h2>

					<div
						className={styles.myStatsBar}
						role="list"
						aria-label="Tus estadísticas en esta partida"
					>
						<span role="listitem">⚔ DAÑO: {me.stats.damageDealt}</span>
						<span role="listitem">🛡 RECIBIDO: {me.stats.damageReceived}</span>
						<span role="listitem">💀 BAJAS: {me.stats.eliminations}</span>
						<span role="listitem">🃏 CARTAS: {me.stats.cardsPlayed}</span>
					</div>

					<h3 className={styles.playersLabel}>SUJETOS INVOLUCRADOS:</h3>

					<div
						className={styles.playersTable}
						role="table"
						aria-label="Lista de jugadores en esta partida"
					>
						<div className={styles.playerHeader} role="row">
							<span role="columnheader">IDENTIFICACIÓN</span>
							<span role="columnheader">ROL</span>
							<span className={styles.textCenter} role="columnheader">
								DAÑO
							</span>
							<span className={styles.textCenter} role="columnheader">
								BAJAS
							</span>
						</div>
						{game.players.map((player) => (
							<PlayerRow key={player.userId} player={player} />
						))}
					</div>
				</div>
			</div>
		</div>
	);
}