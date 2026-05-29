// src/components/profile/GameHistoryRow.tsx
import { useRef, useCallback } from "react";
import type { GameRecord } from "../../../types/api";
import styles from "./GameHistoryRow.module.css";
import { ROLE_LABELS } from "../../../data/game/roles";
import { GameExpandedContent } from "./GameExpandedContent";

interface GameHistoryRowProps {
	game: GameRecord;
	user: string | null | undefined;
	isExpanded: boolean;
	onToggle: (gameId: number | string) => void;
}

export function GameHistoryRow({
	game,
	user,
	isExpanded,
	onToggle,
}: GameHistoryRowProps) {
	const rowRef = useRef<HTMLDivElement>(null);
	const me = game.players.find((p) => p.displayName === user);

	if (!me) return null;

	const won = me.stats.hasWon;
	const gameDate = new Date(game.playedAt).toLocaleDateString("es-ES");
	const gameDescription = `Partida del ${gameDate}. Resultado: ${won ? "Victoria" : "Derrota"}. Rol: ${getRoleLabel(me.stats.role)}`;

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				onToggle(game.id);
				setTimeout(() => rowRef.current?.focus(), 100);
			}
		},
		[game.id, onToggle],
	);

	const handleClick = useCallback(() => {
		onToggle(game.id);
		setTimeout(() => rowRef.current?.focus(), 100);
	}, [game.id, onToggle]);

	return (
		<div className={styles.gameRecord} role="rowgroup">
			<div
				ref={rowRef}
				className={`${styles.gameRow} ${won ? styles.gameRowWin : styles.gameRowLoss}`}
				role="row"
				tabIndex={0}
				aria-expanded={isExpanded}
				aria-label={gameDescription}
				onClick={handleClick}
				onKeyDown={handleKeyDown}
			>
				<span className={styles.gameDate} role="cell">
					{gameDate}
				</span>
				<span
					className={`${styles.gameResult} ${won ? styles.resultWin : styles.resultLoss}`}
					role="cell"
					aria-label={won ? "Resultado: Victoria" : "Resultado: Derrota"}
				>
					{won ? "Victoria" : "Derrota"}
				</span>
				<span className={styles.gameRole} role="cell">
					{getRoleLabel(me.stats.role)}
				</span>
				<span
					className={`${styles.gameMeta} ${styles.textRight}`}
					role="cell"
					aria-label={`${game.totalRounds} rondas`}
				>
					{game.totalRounds}
				</span>
				<span
					className={`${styles.expandIcon} ${styles.textRight}`}
					role="cell"
					aria-label={isExpanded ? "Contraer detalles" : "Expandir detalles"}
				>
					{isExpanded ? "[-]" : "[+]"}
				</span>
			</div>

			<GameExpandedContent game={game} me={me} isExpanded={isExpanded} />
		</div>
	);
}

function getRoleLabel(role: string): string {
	return ROLE_LABELS[role as keyof typeof ROLE_LABELS] ?? role.toUpperCase();
}
