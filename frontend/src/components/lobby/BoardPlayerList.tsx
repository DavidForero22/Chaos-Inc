// src/components/lobby/BoardPlayerList.tsx

import type { RoomPlayer } from "../../types/api";
import styles from "./BoardPlayerList.module.css";

interface BoardPlayerListProps {
	players: RoomPlayer[];
	maxPlayers: number;
	ownerName: string;
	user: string | null;
	onKickClick: (playerId: string) => void;
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
				<div key={player.id} className={styles.playerRow}>
					{" "}
					<div className={`flex items-center ${styles.markerBlack}`}>
						<span className={`${styles.magnet} ${styles.magnetGreen}`}></span>
						{player.name}
						{player.name === user && (
							<span className={`${styles.markerBlue} text-sm ml-3 italic`}>
								(Tú)
							</span>
						)}
						{player.name === ownerName && (
							<span className="text-sm ml-3">⭐ Líder</span>
						)}
					</div>
					{ownerName === user && player.name !== user && (
						<button
							onClick={() => onKickClick(player.id)}
							className={styles.btnErase}
							title={"Expulsar a " + player.name}
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
						Esperando jugadores...
					</div>
				</div>
			)}
		</div>
	);
}
