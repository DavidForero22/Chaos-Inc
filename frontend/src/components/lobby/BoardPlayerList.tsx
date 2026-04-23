// src/components/lobby/BoardPlayerList.tsx

import styles from "./BoardPlayerList.module.css";

interface BoardPlayerListProps {
	players: string[];
	maxPlayers: number;
	ownerName: string;
	user: string | null;
	onKickClick: (player: string) => void;
}

export default function BoardPlayerList({
	players,
	maxPlayers,
	ownerName,
	user,
	onKickClick,
}: BoardPlayerListProps) {
	return (
		<div className={styles.playerList}>
			{players.map((player) => (
				<div key={player} className={styles.playerRow}>
					<div className={`flex items-center ${styles.markerBlack}`}>
						<span className={`${styles.magnet} ${styles.magnetGreen}`}></span>
						{player}
						{player === user && (
							<span className={`${styles.markerBlue} text-sm ml-3 italic`}>
								(Tú)
							</span>
						)}
						{player === ownerName && (
							<span className="text-sm ml-3">⭐ Jefe</span>
						)}
					</div>

					{ownerName === user && player !== user && (
						<button
							onClick={() => onKickClick(player)}
							className={styles.btnErase}
							title={"Expulsar a " + player}
						>
							Expulsar
						</button>
					)}
				</div>
			))}

			{players.length < maxPlayers && (
				<div
					className={`${styles.playerRow} ${styles.markerBlack} opacity-50 italic`}
				>
					<div className="flex items-center">
						<span
							className={`${styles.magnet} ${styles.magnetGray} animate-pulse`}
						></span>
						Esperando asistentes...
					</div>
				</div>
			)}
		</div>
	);
}
