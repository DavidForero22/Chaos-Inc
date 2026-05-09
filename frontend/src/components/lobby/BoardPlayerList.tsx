// src/components/lobby/BoardPlayerList.tsx

import type { RoomPlayer } from "../../types/api";
import styles from "./BoardPlayerList.module.css";

interface BoardPlayerListProps {
	players: RoomPlayer[];
	maxPlayers: number;
	ownerId: string | number; 
	currentUserId: string | number | null; 
	onKickClick: (playerId: string) => void;
}

export default function BoardPlayerList({
	players,
	maxPlayers,
	ownerId,
	currentUserId,
	onKickClick,
}: BoardPlayerListProps) {
	const amIOwner = String(ownerId) === String(currentUserId);

	return (
		<div className={styles.playerList}>
			{players.map((player) => {
				const isMe = String(player.id) === String(currentUserId);
				const isPlayerTheOwner = String(player.id) === String(ownerId);

				return (
					<div key={player.id} className={styles.playerRow}>
						<div className={`flex items-center ${styles.markerBlack}`}>
							<span className={`${styles.magnet} ${styles.magnetGreen}`}></span>
							{player.name}

							{isMe && (
								<span className={`${styles.markerBlue} text-sm ml-3 italic`}>
									(Tú)
								</span>
							)}

							{isPlayerTheOwner && (
								<span className="text-sm ml-3">⭐ Líder</span>
							)}
						</div>

						{/* Mostrar botón de expulsar si soy el líder y este jugador no soy yo */}
						{amIOwner && !isMe && (
							<button
								onClick={() => onKickClick(String(player.id))}
								className={styles.btnErase}
								title={"Expulsar a " + player.name}
							>
								Expulsar
							</button>
						)}
					</div>
				);
			})}

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
