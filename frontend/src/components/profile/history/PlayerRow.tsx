// src/components/profile/PlayerRow.tsx
import { Link } from "react-router-dom";
import type { GameParticipant } from "../../../types/api";
import styles from "./PlayerRow.module.css";
import { ROLE_LABELS } from "../../../data/game/roles";
import { useAuthStore } from "../../../store/auth/useAuthStore";

interface PlayerRowProps {
	player: GameParticipant;
}

export function PlayerRow({ player }: PlayerRowProps) {
	const authUser = useAuthStore((state) => state.user);
	const isUser = !!authUser && player.displayName === authUser;

	return (
		<div
			className={`${styles.playerRow} ${player.stats.hasWon ? styles.playerWon : ""} ${isUser ? styles.currentUserRow : ""}`}
			role="row"
		>
			<span className={styles.playerName} role="cell">
				{player.isGuest ? (
					`${player.displayName} (INVITADO)${isUser ? " (TÚ)" : ""}`
				) : (
					<>
						<Link
							to={`/profile/${player.userId}`}
							className={styles.profileLink}
							aria-label={`Ver perfil de ${player.displayName}${isUser ? " (TÚ)" : ""}`}
						>
							{player.displayName}
						</Link>
						{isUser && <span className={styles.youIndicator}> (TÚ)</span>}
					</>
				)}
			</span>
			<span role="cell">{getRoleLabel(player.stats.role)}</span>
			<span className={styles.textCenter} role="cell">
				{player.stats.damageDealt}
			</span>
			<span className={styles.textCenter} role="cell">
				{player.stats.eliminations}
			</span>
		</div>
	);
}

function getRoleLabel(role: string): string {
	return ROLE_LABELS[role as keyof typeof ROLE_LABELS] ?? role.toUpperCase();
}
