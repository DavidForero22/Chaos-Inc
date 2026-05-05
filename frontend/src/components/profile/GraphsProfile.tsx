import { useMemo } from "react";
import type { GameRecord } from "../../types/api";
import styles from "./GraphsProfile.module.css";
import viewStyles from "./RegisteredProfileView.module.css";

interface GraphsProfileProps {
	games: GameRecord[];
	user: string | null | undefined;
}

export default function GraphsProfile({ games, user }: GraphsProfileProps) {
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
			<p className={viewStyles.sectionLabel}>Estadísticas Globales</p>
			<div className={styles.statsGrid}>
				<div className={styles.statCell}>
					<span className={styles.statLabel}>Victorias</span>
					<span className={`${styles.statValue} ${styles.statValueHighlight}`}>
						{stats.wins}
					</span>
				</div>
				<div className={styles.statCell}>
					<span className={styles.statLabel}>Derrotas</span>
					<span className={styles.statValue}>{games.length - stats.wins}</span>
				</div>
				<div className={styles.statCell}>
					<span className={styles.statLabel}>Eliminaciones</span>
					<span className={styles.statValue}>{stats.eliminations}</span>
				</div>
				<div className={styles.statCell}>
					<span className={styles.statLabel}>Daño infligido</span>
					<span className={styles.statValue}>{stats.damage}</span>
				</div>
				<div className={styles.statCell}>
					<span className={styles.statLabel}>Daño recibido</span>
					<span className={styles.statValue}>{stats.received}</span>
				</div>
				<div className={styles.statCell}>
					<span className={styles.statLabel}>Cartas jugadas</span>
					<span className={styles.statValue}>{stats.cards}</span>
				</div>
			</div>
		</div>
	);
}
