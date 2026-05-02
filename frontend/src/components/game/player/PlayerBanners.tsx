import { useTimerStore } from "../../../store/useTimerStore.ts";
import type { MyData } from "../../../types/live-game.ts";
import styles from "./PlayerBanners.module.css";

interface PlayerBannersProps {
	me: MyData;
}

export function PlayerBanners({ me }: PlayerBannersProps) {
	// Timers
	const multiAttackSecondsLeft = useTimerStore(
		(state) => state.multiAttackSecondsLeft,
	);
	const sabotageSecondsLeft = useTimerStore(
		(state) => state.sabotageSecondsLeft,
	);
	const singleAttackSecondsLeft = useTimerStore(
		(state) => state.singleAttackSecondsLeft,
	);

	return (
		<div className={styles.bannersContainer}>
			{/* Ataque simple entrante */}
			{me.combat_state.is_defending_single &&
				singleAttackSecondsLeft !== null && (
					<div className={styles.warningSlip}>
						<div className={styles.header}>URGENTE</div>
						<div className={styles.content}>
							<span>¡Ataque entrante!</span>
							<span className={styles.timerStamp}>
								{singleAttackSecondsLeft}s
							</span>
						</div>
					</div>
				)}

			{/* Ataque global entrante */}
			{me.combat_state.is_defending_multi &&
				multiAttackSecondsLeft !== null && (
					<div className={styles.warningSlip}>
						<div className={styles.header}>URGENTE</div>
						<div className={styles.content}>
							<span>¡Ataque masivo entrante!</span>
							<span className={styles.timerStamp}>
								{multiAttackSecondsLeft}s
							</span>
						</div>
					</div>
				)}

			{/* Sabotaje pendiente */}
			{me.conditions.must_discard && sabotageSecondsLeft !== null && (
				<div className={`${styles.warningSlip} ${styles.warningSlipOrange}`}>
					<div className={`${styles.header} ${styles.headerOrange}`}>
						NOTIFICACIÓN
					</div>
					<div className={styles.content}>
						<span>¡Descarta una carta!</span>
						<span className={`${styles.timerStamp} ${styles.timerStampOrange}`}>
							{sabotageSecondsLeft}s
						</span>
					</div>
				</div>
			)}
		</div>
	);
}
